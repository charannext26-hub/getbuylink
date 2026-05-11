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
    else if (url.includes('myntra.com') || url.includes('myntra.')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=com.myntra.android;S.browser_fallback_url=${fallbackUrl};end`;
    } 
    // Shopsy
    else if (url.includes('shopsy.')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=com.flipkart.shopsy;S.browser_fallback_url=${fallbackUrl};end`;
    } 
    // Meesho
    else if (url.includes('meesho.')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=com.meesho.supply;S.browser_fallback_url=${fallbackUrl};end`;
    } 
    // Ajio
    else if (url.includes('ajio.')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=com.ril.ajio;S.browser_fallback_url=${fallbackUrl};end`;
    }
    
    // Default Fallback
    return `intent://${cleanUrl}#Intent;scheme=https;end`;
}

export async function GET(req, { params }) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const resolvedParams = await params;
    const shortCode = resolvedParams.shortCode; 
    
    // 🚨 Action detect karenge (ki user abhi Chrome mein aaya hai ya Instagram mein hai)
    const action = req.nextUrl.searchParams.get("action");

    // Database check
    const linkData = await LinkPerformance.findOne({ shortCode: shortCode });

    if (!linkData) {
      return new NextResponse("Invalid or Expired Link!", { status: 404 });
    }

    // Click track (Sirf pehli baar jab click ho)
    if (action !== "chrome") {
        linkData.clicks += 1;
        linkData.lastClickedAt = new Date();
        await linkData.save();
    }

    const targetUrl = linkData.affiliateUrl;

    // ========================================================
    // 🚀 PHASE 2: CHROME BOUNCE (The Real App Opener)
    // ========================================================
    if (action === "chrome") {
        // 🔥 YAHAN HUA HAI ASLI MAGIC!
        // Ab Chrome ke andar hum 302 nahi maarenge, seedha specific App ka intent fire karenge
        const finalAppIntent = getAppIntent(targetUrl);
        
        const chromeHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Opening App...</title>
                <style>
                    body { background-color: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; text-align: center; }
                    .loader { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            </head>
            <body>
                <div class="loader"></div>
                <h3 style="color: #e2e8f0;">Opening App...</h3>
                <script>
                    // Ye script chalte hi Chrome seedha Amazon/Flipkart App khol dega!
                    window.location.replace("${finalAppIntent}");
                    
                    // Agar kisi wajah se app install nahi hai, toh 1.5 second baad fallback URL (Chrome web) khul jayega
                    setTimeout(function() {
                        window.location.replace("${targetUrl}");
                    }, 1500);
                </script>
            </body>
            </html>
        `;
        return new NextResponse(chromeHtml, { status: 200, headers: { "Content-Type": "text/html" } });
    }

    // ========================================================
    // 🚀 PHASE 1: INSTAGRAM IN-APP BROWSER TRAP
    // ========================================================
    const userAgent = req.headers.get("user-agent") || "";
    const isInstagram = userAgent.includes("Instagram");
    const isFacebook = userAgent.includes("FBAN") || userAgent.includes("FBAV");
    const isAndroid = userAgent.includes("Android");
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

    const isInAppBrowser = isInstagram || isFacebook;

    if (isInAppBrowser) {
        if (isAndroid) {
            // Instagram ko bolenge "Mera apna page Chrome mein khol"
            const host = req.headers.get("host");
            const proto = req.headers.get("x-forwarded-proto") || "https";
            
            // User ko wapas isi page par bhej rahe hain, par ?action=chrome lagakar
            const bounceUrl = `${host}/go/${shortCode}?action=chrome`;
            const chromeIntentUrl = `intent://${bounceUrl}#Intent;scheme=${proto};package=com.android.chrome;end`;
            
            const androidHtml = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Redirecting to App...</title>
                    <style>
                        body { background-color: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; text-align: center; }
                        .loader { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    </style>
                </head>
                <body>
                    <div class="loader"></div>
                    <h2>Taking you to the App...</h2>
                    <script>
                        // Ye script chalte hi Instagram native popup dega "You're leaving our app... Continue"
                        window.location.href = "${chromeIntentUrl}";
                    </script>
                </body>
                </html>
            `;
            return new NextResponse(androidHtml, { status: 200, headers: { "Content-Type": "text/html" } });

        } else if (isIOS) {
            // 🍎 iOS Apple rules (Unchanged)
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

    // NORMAL BROWSER USERS (Direct redirect without delay)
    return NextResponse.redirect(targetUrl, 302);

  } catch (error) {
    console.error("Shortlink Redirect Error:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}