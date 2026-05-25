import { NextResponse } from "next/server";
import mongoose from "mongoose";
import LinkPerformance from "@/lib/models/LinkPerformance";

// 🎯 THE ULTIMATE CHROMIUM BREAKOUT INTENT
function getExternalBrowserIntent(url) {
    const cleanUrl = url.replace(/^https?:\/\//, ""); 
    const fallbackUrl = encodeURIComponent(url);
    // Ye intent Instagram ko force karega link ko phone ke default external browser (Chrome) mein kholne ke liye
    return `intent://${cleanUrl}#Intent;scheme=https;S.browser_fallback_url=${fallbackUrl};end;`;
}

export async function GET(req, { params }) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const resolvedParams = await params;
    const shortCode = resolvedParams.shortCode; 

    // 1. Database Check
    const linkData = await LinkPerformance.findOne({ shortCode: shortCode });
    if (!linkData) {
      return new NextResponse("Invalid or Expired Link!", { status: 404 });
    }

    // 2. 🚀 GENERATE UNIQUE CLICK ID (Har ek click ke liye bilkul unique)
    const uniqueClickId = `CLK_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 3. 💾 LOG CLICK TO DATABASE (Sankmo Postback se map karne ke liye)
    await mongoose.connection.db.collection('clicklogs').insertOne({
        clickId: uniqueClickId,
        shortCode: shortCode,
        creatorId: linkData.creatorId,
        store: linkData.store,
        clickedAt: new Date(),
        status: "pending"
    });

    // 4. Increment Total Clicks
    linkData.clicks += 1;
    linkData.lastClickedAt = new Date();
    await linkData.save();

    let finalAffiliateUrl = linkData.affiliateUrl;

    // 5. 🔗 INJECT UNIQUE CLICK ID INTO SANKMO/CUELINKS URL
    try {
        const urlObj = new URL(finalAffiliateUrl);
        if (finalAffiliateUrl.includes('sankmo.in')) {
            // Sankmo ke dashboard mein ye click_id dynamically reflect hoga
            urlObj.searchParams.set('click_id', uniqueClickId);
        } else if (finalAffiliateUrl.includes('linksredirect.com') || finalAffiliateUrl.includes('cuelinks')) {
            urlObj.searchParams.set('subid4', uniqueClickId); 
        }
        finalAffiliateUrl = urlObj.toString();
    } catch(e) {
        if (finalAffiliateUrl.includes('sankmo.in')) finalAffiliateUrl += `&click_id=${uniqueClickId}`;
    }

    // 6. 🕵️‍♂️ USER-AGENT DETECTION FOR IN-APP BROWSERS
    const userAgent = req.headers.get("user-agent") || "";
    const isInstagram = userAgent.includes("Instagram");
    const isFacebook = userAgent.includes("FBAN") || userAgent.includes("FBAV");
    const isAndroid = userAgent.includes("Android");
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

    const isInAppBrowser = isInstagram || isFacebook;

    // ========================================================
    // SCENARIO 1: ANDROID INSTAGRAM / FACEBOOK (The Wishlink/Lehlah Popup Trick)
    // ========================================================
    if (isInAppBrowser && isAndroid) {
        const breakoutIntent = getExternalBrowserIntent(finalAffiliateUrl);
        
        const intermediateHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Redirecting to Store...</title>
                <style>
                    body { background-color: #0b0f19; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: -apple-system, sans-serif; text-align: center; }
                    .loader-container { position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
                    .loader { border: 4px solid rgba(255,255,255,0.05); border-top: 4px solid #f43f5e; border-radius: 50%; width: 60px; height: 60px; animation: spin 1s linear infinite; }
                    .icon { position: absolute; font-size: 24px; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    h3 { font-size: 20px; font-weight: 600; color: #f1f5f9; margin: 0 0 8px 0; }
                    p { color: #94a3b8; font-size: 14px; margin: 0 0 30px 0; padding: 0 20px; }
                    .manual-btn { background: linear-gradient(135deg, #e11d48, #be123c); color: white; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(225, 29, 72, 0.4); display: inline-block; transition: transform 0.2s; }
                </style>
            </head>
            <body>
                <div class="loader-container">
                    <div class="loader"></div>
                    <div class="icon">🚀</div>
                </div>
                <h3>Opening Shopping App</h3>
                <p>Leaving Instagram to best discount prices...</p>
                
                <a href="${breakoutIntent}" class="manual-btn">Continue to App</a>

                <script>
                    // Auto-trigger the breakout intent instantly
                    setTimeout(() => {
                        window.location.href = "${breakoutIntent}";
                    }, 100);
                </script>
            </body>
            </html>
        `;
        return new NextResponse(intermediateHtml, { status: 200, headers: { "Content-Type": "text/html" } });
    }

    // ========================================================
    // SCENARIO 2: iOS (iPhone) INSTAGRAM / FACEBOOK
    // ========================================================
    if (isInAppBrowser && isIOS) {
        const iosHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Open in Safari</title>
                <style>
                    body { margin: 0; padding: 0; background: #0b0f19; color: white; font-family: -apple-system, sans-serif; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                    .overlay-top { position: fixed; top: 15px; right: 20px; z-index: 999; }
                    .arrow { font-size: 40px; color: #f43f5e; animation: bounce 0.8s infinite alternate; }
                    @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }
                    .box { background: #111827; padding: 30px 24px; border-radius: 24px; text-align: center; width: 85%; max-width: 320px; border: 1px solid #1f2937; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
                    .btn { display: inline-block; margin-top: 24px; padding: 14px 28px; background: #f43f5e; color: white; text-decoration: none; border-radius: 9999px; font-weight: 600; width: 80%; }
                </style>
            </head>
            <body>
                <div class="overlay-top"><div class="arrow">↗</div></div>
                <div class="box">
                    <h2 style="margin: 0 0 12px 0; font-size: 22px;">Almost There!</h2>
                    <p style="margin: 0; color: #94a3b8; font-size: 15px; line-height: 1.5;">Tap the <b>three dots (...)</b> at the top right and select:<br><br><b style="color: #f43f5e; font-size: 16px;">"Open in Browser"</b></p>
                    <a href="${finalAffiliateUrl}" class="btn">Open Anyway</a>
                </div>
            </body>
            </html>
        `;
        return new NextResponse(iosHtml, { status: 200, headers: { "Content-Type": "text/html" } });
    }

    // ========================================================
    // SCENARIO 3: DIRECT BROWSERS (Chrome, YouTube, WhatsApp, Telegram, Safari)
    // ========================================================
    return NextResponse.redirect(finalAffiliateUrl, 302);

  } catch (error) {
    console.error("Shortlink Redirect Error:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}