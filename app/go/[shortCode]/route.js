import { NextResponse } from "next/server";
import mongoose from "mongoose";
import LinkPerformance from "@/lib/models/LinkPerformance";

// 🎯 THE MASTER APP DETECTOR (Generates Intent URLs for Specific Apps)
function getAppIntent(url) {
    const fallbackUrl = encodeURIComponent(url);
    const cleanUrl = url.replace(/^https?:\/\//, ""); 

    // Amazon
    if (url.includes('amazon.') || url.includes('amzn.')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=in.amazon.mShop.android.shopping;S.browser_fallback_url=${fallbackUrl};end`;
    } 
    // Flipkart
    else if (url.includes('flipkart.') || url.includes('fkrt.it') || url.includes('fktr.in')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=com.flipkart.android;S.browser_fallback_url=${fallbackUrl};end`;
    } 
    // Myntra
    else if (url.includes('myntra.com')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=com.myntra.android;S.browser_fallback_url=${fallbackUrl};end`;
    } 
    // Shopsy
    else if (url.includes('shopsy.in')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=com.flipkart.shopsy;S.browser_fallback_url=${fallbackUrl};end`;
    } 
    // Meesho
    else if (url.includes('meesho.com') || url.includes('meesho.in')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=com.meesho.supply;S.browser_fallback_url=${fallbackUrl};end`;
    } 
    // Ajio
    else if (url.includes('ajio.com')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=com.ril.ajio;S.browser_fallback_url=${fallbackUrl};end`;
    }
    
    // Default Fallback: Force open in Chrome (if app not specified)
    return `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallbackUrl};end`;
}

export async function GET(req, { params }) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const resolvedParams = await params;
    const shortCode = resolvedParams.shortCode; 

    // Database check
    const linkData = await LinkPerformance.findOne({ shortCode: shortCode });

    if (!linkData) {
      return new NextResponse("Invalid or Expired Link!", { status: 404 });
    }

    // Click track
    linkData.clicks += 1;
    linkData.lastClickedAt = new Date();
    await linkData.save();

    const targetUrl = linkData.affiliateUrl;

    // ========================================================
    // 🚀 THE SMART APP OPENER LOGIC
    // ========================================================
    const userAgent = req.headers.get("user-agent") || "";
    const isInstagram = userAgent.includes("Instagram");
    const isFacebook = userAgent.includes("FBAN") || userAgent.includes("FBAV");
    const isAndroid = userAgent.includes("Android");
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

    const isInAppBrowser = isInstagram || isFacebook;

    // SCENARIO 1: Android User in Instagram/Facebook
    if (isInAppBrowser && isAndroid) {
        // 🔥 Server-side redirect direct to Intent URL.
        // Ye line execute hote hi Instagram us "You are leaving our app" wale native popup ko fire karega.
        // Continue dabate hi Chrome/Native App khul jayega, bina uss error page ke!
        const intentUrl = getAppIntent(targetUrl);
        return NextResponse.redirect(intentUrl, 302);
    }

    // SCENARIO 2: iPhone (iOS) User in Instagram/Facebook
    if (isInAppBrowser && isIOS) {
        // 🍎 iOS Safari Trick (Custom HTML to guide user)
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

    // SCENARIO 3: Normal Users (Chrome/Safari) - Direct Redirect
    return NextResponse.redirect(targetUrl, 302);

  } catch (error) {
    console.error("Shortlink Redirect Error:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}