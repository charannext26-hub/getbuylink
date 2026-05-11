import { NextResponse } from "next/server";
import mongoose from "mongoose";
import LinkPerformance from "@/lib/models/LinkPerformance";

export async function GET(req, { params }) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const resolvedParams = await params;
    const shortCode = resolvedParams.shortCode; 
    const action = req.nextUrl.searchParams.get("action");

    const linkData = await LinkPerformance.findOne({ shortCode: shortCode });

    if (!linkData) {
      return new NextResponse("Invalid or Expired Link!", { status: 404 });
    }

    if (action !== "chrome") {
        linkData.clicks += 1;
        linkData.lastClickedAt = new Date();
        await linkData.save();
    }

    const targetUrl = linkData.affiliateUrl;

    // ========================================================
    // 🚀 PHASE 2: CHROME BRIDGE (Professional "Deal Activated" Page)
    // ========================================================
    if (action === "chrome") {
        const chromeHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Deal Activated | GetBuyLink</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { background-color: #09090b; color: white; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
                    .container { width: 90%; max-width: 400px; text-align: center; position: relative; }
                    .card { background: linear-gradient(180deg, #18181b 0%, #09090b 100%); padding: 40px 24px; border-radius: 32px; border: 1px solid #27272a; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
                    .icon-box { width: 72px; height: 72px; background: rgba(16, 185, 129, 0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto; border: 1px solid rgba(16, 185, 129, 0.2); }
                    .icon-box svg { width: 32px; height: 32px; color: #10b981; }
                    h2 { font-size: 24px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
                    p { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 32px; }
                    .btn { background: #10b981; color: white; padding: 18px 32px; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 16px; display: block; transition: all 0.3s ease; box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4); border: none; width: 100%; cursor: pointer; }
                    .btn:active { transform: scale(0.98); }
                    .pulse-ring { position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 16px; background: #10b981; opacity: 0.3; animation: pulse 2s cubic-bezier(0.24, 0, 0.38, 1) infinite; z-index: -1; }
                    @keyframes pulse { 0% { transform: scale(1); opacity: 0.3; } 100% { transform: scale(1.15, 1.3); opacity: 0; } }
                    .footer-text { margin-top: 24px; color: #52525b; font-size: 12px; display: flex; items-center; justify-content: center; gap: 4px; }
                    .footer-text svg { width: 14px; height: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="card">
                        <div class="icon-box">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <h2>Deal Activated!</h2>
                        <p>We've found the lowest price and secured your extra cashback tracking.</p>
                        
                        <div style="position: relative;">
                            <a href="${targetUrl}" class="btn" id="mainBtn">SHOP IN APP</a>
                            <div class="pulse-ring"></div>
                        </div>

                        <div class="footer-text">
                            <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                            100% Secure & Verified Link
                        </div>
                    </div>
                </div>

                <script>
                    // User gesture ke liye wait karega, ya 3s baad auto-try
                    document.body.onclick = function() { window.location.href = "${targetUrl}"; }
                    setTimeout(() => { window.location.href = "${targetUrl}"; }, 3000);
                </script>
            </body>
            </html>
        `;
        return new NextResponse(chromeHtml, { status: 200, headers: { "Content-Type": "text/html" } });
    }

    // ========================================================
    // 🚀 PHASE 1: INSTAGRAM BYPASS
    // ========================================================
    const userAgent = req.headers.get("user-agent") || "";
    const isInstagram = userAgent.includes("Instagram");
    const isFacebook = userAgent.includes("FBAN") || userAgent.includes("FBAV");
    const isAndroid = userAgent.includes("Android");
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

    if ((isInstagram || isFacebook) && isAndroid) {
        const host = req.headers.get("host");
        const proto = req.headers.get("x-forwarded-proto") || "https";
        const bounceUrl = `${host}/go/${shortCode}?action=chrome`;
        const chromeIntentUrl = `intent://${bounceUrl}#Intent;scheme=${proto};package=com.android.chrome;end`;
        
        return new NextResponse(`<html><body><script>window.location.href="${chromeIntentUrl}";</script></body></html>`, { status: 200, headers: { "Content-Type": "text/html" } });
    }

    if ((isInstagram || isFacebook) && isIOS) {
        // iOS Guide UI (Aapka purana UI bhi use kar sakte hain)
        return new NextResponse(`<html><body style="background:#000;color:white;text-align:center;padding:50px;"><h2>Tap 3 dots & Open in Browser</h2></body></html>`, { status: 200, headers: { "Content-Type": "text/html" } });
    }

    return NextResponse.redirect(targetUrl, 302);

  } catch (error) {
    return new NextResponse("Error", { status: 500 });
  }
}