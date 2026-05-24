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

    // 1. Database Check
    const linkData = await LinkPerformance.findOne({ shortCode: shortCode });

    if (!linkData) {
      return new NextResponse("Invalid or Expired Link!", { status: 404 });
    }

    // 2. 🚀 GENERATE UNIQUE CLICK ID FOR TRACKING
    const uniqueClickId = `CLK_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 3. 💾 LOG CLICK DIRECTLY TO DATABASE
    await mongoose.connection.db.collection('clicklogs').insertOne({
        clickId: uniqueClickId,
        shortCode: shortCode,
        creatorId: linkData.creatorId,
        store: linkData.store,
        clickedAt: new Date(),
        status: "pending"
    });

    // 4. Update General Performance Stats
    linkData.clicks += 1;
    linkData.lastClickedAt = new Date();
    await linkData.save();

    let targetUrl = linkData.affiliateUrl;

    // 5. 🔗 DYNAMICALLY ATTACH CLICK ID TO URL
    try {
        const urlObj = new URL(targetUrl);
        if (targetUrl.includes('sankmo.in')) {
            urlObj.searchParams.set('click_id', uniqueClickId);
        } else if (targetUrl.includes('linksredirect.com') || targetUrl.includes('cuelinks')) {
            urlObj.searchParams.set('subid4', uniqueClickId); 
        }
        targetUrl = urlObj.toString();
    } catch(e) {
        if (targetUrl.includes('sankmo.in')) targetUrl += `&click_id=${uniqueClickId}`;
    }

    // ========================================================
    // 🚀 PLATFORM DETECTION & ROUTING LOGIC (TRACKING SAFE)
    // ========================================================
    const userAgent = req.headers.get("user-agent") || "";
    const isInAppBrowser = userAgent.includes("Instagram") || userAgent.includes("FBAN") || userAgent.includes("FBAV");
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

    // SCENARIO 1: iOS (iPhone) on Instagram/Facebook
    // Apple bohot strict hai, isliye inko external browser mein nikalna zaroori hai cookie ke liye
    if (isInAppBrowser && isIOS) {
        const iosHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Please Open in Browser</title>
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
                    <p style="margin: 0; color: #cbd5e1;">For the best experience, tap the <b>3 dots (...)</b> at the top right and select:<br><br><b style="color: #10b981;">"Open in Browser"</b></p>
                    <a href="${targetUrl}" class="btn">Try Opening Anyway</a>
                </div>
            </body>
            </html>
        `;
        return new NextResponse(iosHtml, { status: 200, headers: { "Content-Type": "text/html" } });
    }

    // SCENARIO 2: EVERYONE ELSE (Android Instagram, Chrome, Safari, YouTube, etc.)
    // Direct 302 Redirect. Sankmo aur Cuelinks ki cookies drop hongi aur wo khud App open kar denge.
    return NextResponse.redirect(targetUrl, 302);

  } catch (error) {
    console.error("Shortlink Redirect Error:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}