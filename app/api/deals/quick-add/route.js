import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import User from "@/lib/models/User";
import LinkPerformance from "@/lib/models/LinkPerformance";

// 🚨 MASTER TRICK: The URL Cleaner
function cleanProductUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    let urlString = rawUrl.trim();
    const urlMatch = urlString.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
        urlString = urlMatch[1];
    } else if (!urlString.startsWith('http')) {
        urlString = 'https://' + urlString;
    }
    const urlObj = new URL(urlString);
    const paramsToRemove = [
      'tag', 'linkCode', 'linkId', 'ref_', 'ascsubtag', 
      'affid', 'cmpid', 'affExtParam1', 'affExtParam2', 
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 
      'subid', 'clickId', 'igshid', 'mibextid' 
    ];
    paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
    return urlObj.toString();
  } catch (e) {
    return rawUrl; 
  }
}

export async function POST(req) {
  try {
    // 1. Session Check
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Login required!" }, { status: 401 });
    }

    // 2. Parse Incoming Data from Frontend
    const body = await req.json();
    const { action, deal } = body; 

    if (!deal || !deal.originalUrl) {
      return NextResponse.json({ success: false, message: "Invalid product data" }, { status: 400 });
    }

    // 3. Connect to DB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 4. Get Creator's Username & Amazon Tag
    const dbUser = await User.findOne({ email: session.user.email });
    let safeUsername = "creator";
    let creatorTag = ""; // NAYA: Amazon tag ke liye
    if (dbUser) {
      if (dbUser.username) safeUsername = dbUser.username.replace(/[^a-zA-Z0-9]/g, '');
      if (dbUser.amazonTag) creatorTag = dbUser.amazonTag.trim();
    } else {
      safeUsername = session.user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    }

    // 🚨 NAYA: Pehle URL saaf karo (Scrubbing)
    const rawLongUrl = deal.expandedUrl || deal.originalUrl;
    const cleanedUrl = cleanProductUrl(rawLongUrl);

    // 5. Check if this link was ALREADY generated
    let existingPerformance = await LinkPerformance.findOne({
      creatorId: safeUsername,
      originalUrl: cleanedUrl // Ab cleaned URL match hoga
    });

    let shortCodeToReturn = "";
    let affiliateUrlToUse = "";
    let finalStoreName = deal.storeName || "PlatformDeal";

    if (existingPerformance) {
      shortCodeToReturn = existingPerformance.shortCode;
      affiliateUrlToUse = existingPerformance.affiliateUrl;
    } else {
      // 🚨 FIX 1: Shortcode pehle generate karo!
      shortCodeToReturn = Math.random().toString(36).substring(2, 8);

      let isAmazonLink = false;
      try {
          const checkUrl = new URL(cleanedUrl);
          isAmazonLink = checkUrl.hostname.includes('amazon') || checkUrl.hostname.includes('amzn');
      } catch(e) {}

      finalStoreName = isAmazonLink ? "Amazon" : finalStoreName;

      // 🚨 FIX 2: Smart Router (Amazon vs Cuelinks) + SubID1 & SubID2
      if (isAmazonLink && creatorTag) {
          try {
              const amzUrl = new URL(cleanedUrl);
              amzUrl.searchParams.set('tag', creatorTag);
              affiliateUrlToUse = amzUrl.toString();
          } catch(e) {
              affiliateUrlToUse = cleanedUrl + (cleanedUrl.includes('?') ? '&' : '?') + `tag=${creatorTag}`;
          }
      } else {
          const pubId = (process.env.CUELINKS_PUB_ID || "246005").trim();
          // Yahan apka Master Logic lag gaya!
          affiliateUrlToUse = `https://linksredirect.com/?cid=${pubId}&source=getbuylink&subid=${safeUsername}&subid2=${shortCodeToReturn}&subid3=manual&url=${encodeURIComponent(cleanedUrl)}`;
      }

      // Save to Tracking Database
      await LinkPerformance.create({
        creatorId: safeUsername,
        shortCode: shortCodeToReturn,
        subId: safeUsername,
        originalUrl: cleanedUrl, // Saved cleaned url
        affiliateUrl: affiliateUrlToUse,
        title: deal.title,
        store: finalStoreName, 
        source: "manual",
        linkType: "platform",
        clicks: 0
      });
    }

    // 6. Action specific logic: "Push to Page" saves to GlobalDeal
    if (action === "push") {
      const existingGlobalDeal = await GlobalDeal.findOne({
        creatorId: session.user.email || session.user.id,
        originalUrl: deal.originalUrl // UI reference ke liye
      });

      if (!existingGlobalDeal) {
        await GlobalDeal.create({
          creatorId: session.user.email || session.user.id,
          source: "creator",
          linkType: "platform",
          originalUrl: deal.originalUrl,
          
          // 🚨 THE BIGGEST FIX: Bio page par Click tracker link jayega! (affiliateUrlToUse NAHI jayega)
          expandedUrl: `/go/${shortCodeToReturn}`, 
          shortCode: shortCodeToReturn, // NAYA
          
          store: finalStoreName, 
          title: deal.title,
          image: deal.imageUrl,
          price: deal.price || "",
          discountPercent: deal.discountPercent || "",
          couponCode: deal.coupon || "",
          saleEndTime: deal.timer ? new Date(deal.timer) : null,
          category: "Home Page Deal",
          isExpired: false
        });
      }
    }

    // 7. Success Return
    return NextResponse.json({
      success: true,
      shortCode: shortCodeToReturn,
      message: action === "copy" ? "Link generated & copied!" : "Added to your Bio Page!"
    });

  } catch (error) {
    console.error("Quick Add API Error:", error);
    return NextResponse.json({ success: false, message: "Server error", error: error.message }, { status: 500 });
  }
}