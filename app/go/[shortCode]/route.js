import { NextResponse } from "next/server";
import mongoose from "mongoose";
import LinkPerformance from "@/lib/models/LinkPerformance";

// 🎯 THE MASTER APP DETECTOR (Generates Intent URLs for Specific Apps)
function getAppIntent(url) {
    const fallbackUrl = encodeURIComponent(url);
    const cleanUrl = url.replace(/^https?:\/\//, ""); 

    if (url.includes('amazon.') || url.includes('amzn.')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=in.amazon.mShop.android.shopping;S.browser_fallback_url=${fallbackUrl};end`;
    } else if (url.includes('flipkart.') || url.includes('fkrt.it') || url.includes('fktr.in')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=com.flipkart.android;S.browser_fallback_url=${fallbackUrl};end`;
    } else if (url.includes('myntra.com') || url.includes('myntra.')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=com.myntra.android;S.browser_fallback_url=${fallbackUrl};end`;
    } else if (url.includes('shopsy.')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=com.flipkart.shopsy;S.browser_fallback_url=${fallbackUrl};end`;
    } else if (url.includes('meesho.')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=com.meesho.supply;S.browser_fallback_url=${fallbackUrl};end`;
    } else if (url.includes('ajio.')) {
        return `intent://${cleanUrl}#Intent;scheme=https;package=com.ril.ajio;S.browser_fallback_url=${fallbackUrl};end`;
    }
    return `intent://${cleanUrl}#Intent;scheme=https;end`;
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

    let targetUrl = linkData.affiliateUrl;

    // ========================================================
    // 🕵️‍♂️ THE MAGIC: SERVER-SIDE URL UNROLLER (OpeninApp Hack)
    // ========================================================
    // Agar link Cuelinks (linksredirect) ka hai, toh hum server par hi usko resolve kar lenge 
    // taaki final Amazon/Shopsy URL (with affiliate tags) mil jaye.
    if (targetUrl.includes('linksredirect.com') || targetUrl.includes('cuelinks')) {
        try {
            const fetchRes = await fetch(targetUrl, {
                method: 'GET',
                redirect: 'manual', // 🚨 Important: Auto-follow nahi karna, sirf headers padhne hain
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
                }
            });
            
            // Agar Cuelinks ne 301/302 redirect mara hai, toh final URL Location header mein hoga (Jaise aapke screenshot 3 mein tha)
            if (fetchRes.status >= 300 && fetchRes.status < 400) {
                const finalLocation = fetchRes.headers.get('location');
                if (finalLocation) {
                    targetUrl = finalLocation; // 🚀 AB targetUrl direct Shopsy/Amazon ka ban gaya!
                }
            }
        } catch (error) {
            console.log("URL Unroll failed, using original", error);
        }
    }

    // ========================================================
    // 🚀 INSTAGRAM/FACEBOOK IN-APP BROWSER BYPASS
    // ========================================================
    const userAgent = req.headers.get("user-agent") || "";
    const isInstagram = userAgent.includes("Instagram");
    const isFacebook = userAgent.includes("FBAN") || userAgent.includes("FBAV");
    const isAndroid = userAgent.includes("Android");
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

    if (isInstagram || isFacebook) {
        if (isAndroid) {
            // Ab hum direct FINAL URL ka intent bana rahe hain (Cuelinks bypass ho gaya)
            const finalAppIntent = getAppIntent(targetUrl);
            
            const androidHtml = `
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
                    <script>
                        // Instagram Continue popup layega, aur direct App open hoga!
                        window.location.replace("${finalAppIntent}");
                    </script>
                </body>
                </html>
            `;
            return new NextResponse(androidHtml, { status: 200, headers: { "Content-Type": "text/html" } });

        } else if (isIOS) {
            // iOS Guide UI
            const iosHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { margin: 0; padding: 0; background: rgba(15, 23, 42, 0.95); color: white; font-family: sans-serif; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                        .overlay-top { position: fixed; top: 15px; right: 20px; z-index: 999; }
                        .arrow { font-size: 50px; color: #10b981; animation: bounce 1s infinite alternate; }
                        @keyframes bounce { from { transform: translate(0, 0); } to { transform: translate(10px, -10px); } }
                        .box { background: #1e293b; padding: 30px 20px; border-radius: 20px; text-align: center; width: 85%; max-width: 320px; border: 1px solid #334155; }
                        .btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 10px; font-weight: 900; }
                    </style>
                </head>
                <body>
                    <div class="overlay-top"><div class="arrow">↗</div></div>
                    <div class="box">
                        <h2 style="margin: 0 0 10px 0;">Almost there!</h2>
                        <p style="margin: 0; color: #cbd5e1;">Tap the <b>3 dots (...)</b> at the top right and select:<br><br><b style="color: #10b981;">"Open in Browser"</b></p>
                        <a href="${targetUrl}" class="btn">Try Opening Anyway</a>
                    </div>
                </body>
                </html>
            `;
            return new NextResponse(iosHtml, { status: 200, headers: { "Content-Type": "text/html" } });
        }
    }

    // Normal Browsers
    return NextResponse.redirect(targetUrl, 302);

  } catch (error) {
    console.error("Shortlink Redirect Error:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}