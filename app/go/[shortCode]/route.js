import { NextResponse } from "next/server";
import mongoose from "mongoose";
import LinkPerformance from "@/lib/models/LinkPerformance";

export async function GET(req, { params }) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 1. URL se short code nikalo
    const resolvedParams = await params;
    const shortCode = resolvedParams.shortCode; 
    
    // 🚨 NAYA: Check karo ki kya hum Chrome ke andar wale step par hain
    const action = req.nextUrl.searchParams.get("action");

    // 2. Database mein dhoondho ki yeh code kiska hai
    const linkData = await LinkPerformance.findOne({ shortCode: shortCode });

    if (!linkData) {
      return new NextResponse("Invalid or Expired Link!", { status: 404 });
    }

    // 3. Click count +1 kar do (Sirf pehli baar)
    if (action !== "chrome") {
        linkData.clicks += 1;
        linkData.lastClickedAt = new Date();
        await linkData.save();
    }

    const targetUrl = linkData.affiliateUrl;

    // ========================================================
    // 🚀 PHASE 2: CHROME BOUNCE (Direct App Opener without Button)
    // ========================================================
    if (action === "chrome") {
        // Yahan HTML return karne ke bajaye, hum seedha 302 Redirect maar rahe hain.
        // Chrome isko background mein follow karega aur seedha Native App (Flipkart/Amazon) khol dega!
        return NextResponse.redirect(targetUrl, 302);
    }

    // ========================================================
    // 🚀 PHASE 1: INSTAGRAM SE CHROME MEIN BHEJNA
    // ========================================================
    const userAgent = req.headers.get("user-agent") || "";
    const isInstagram = userAgent.includes("Instagram");
    const isFacebook = userAgent.includes("FBAN") || userAgent.includes("FBAV");
    const isAndroid = userAgent.includes("Android");
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

    const isInAppBrowser = isInstagram || isFacebook;

    if (isInAppBrowser) {
        if (isAndroid) {
            // Hum apna hi link bhejenge but "?action=chrome" lagake taaki Chrome mein Phase 2 chale.
            // Ye ekdum clean URL hai, isse Instagram crash ("Page can't be loaded") nahi hoga!
            const host = req.headers.get("host");
            const proto = req.headers.get("x-forwarded-proto") || "https";
            const chromeBounceUrl = `${host}/go/${shortCode}?action=chrome`;
            
            const intentUrl = `intent://${chromeBounceUrl}#Intent;scheme=${proto};package=com.android.chrome;end`;

            const androidHtml = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Redirecting...</title>
                    <style>
                        body { background-color: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
                        .loader { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    </style>
                </head>
                <body>
                    <div class="loader"></div>
                    <script>
                        // Ye script chalte hi Insta "Leaving app... Continue?" wala popup dikhayega
                        window.location.href = "${intentUrl}";
                    </script>
                </body>
                </html>
            `;
            return new NextResponse(androidHtml, { status: 200, headers: { "Content-Type": "text/html" } });

        } else if (isIOS) {
            // 🍎 iOS Safari Trick
            const iosHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Please Open in Browser</title>
                    <style>
                        body { margin: 0; padding: 0; background: rgba(15, 23, 42, 0.95); color: white; font-family: sans-serif; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
                        .overlay-top { position: fixed; top: 15px; right: 20px; text-align: right; z-index: 999; }
                        .arrow { font-size: 50px; color: #10b981; animation: bounce 1s infinite alternate; text-shadow: 0 0 10px rgba(16, 185, 129, 0.5); }
                        @keyframes bounce { from { transform: translate(0, 0); } to { transform: translate(10px, -10px); } }
                        .box { background: #1e293b; padding: 30px 20px; border-radius: 20px; text-align: center; width: 85%; max-width: 320px; border: 1px solid #334155; box-shadow: 0 20px 40px rgba(0,0,0,0.5); margin-top: 40px; }
                        .icon { font-size: 45px; margin-bottom: 10px; }
                        .btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 10px; font-weight: 900; font-size: 14px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); }
                    </style>
                </head>
                <body>
                    <div class="overlay-top"><div class="arrow">↗</div></div>
                    <div class="box">
                        <div class="icon">🛒</div>
                        <h2 style="margin: 0 0 10px 0; font-size: 22px;">Almost there!</h2>
                        <p style="margin: 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">Instagram blocks shopping apps. To continue, tap the <b>3 dots (...)</b> at the top right and select:<br><br><b style="color: #10b981; font-size: 17px; background: rgba(16,185,129,0.1); padding: 5px 10px; border-radius: 5px;">"Open in Browser"</b></p>
                        <a href="${targetUrl}" class="btn">Try Opening Anyway</a>
                    </div>
                </body>
                </html>
            `;
            return new NextResponse(iosHtml, { status: 200, headers: { "Content-Type": "text/html" } });
        }
    }

    // NORMAL BROWSER USERS (Direct redirect)
    return NextResponse.redirect(targetUrl, 302);

  } catch (error) {
    console.error("Shortlink Redirect Error:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}