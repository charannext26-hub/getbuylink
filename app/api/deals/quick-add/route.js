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

// 🎯 STORE ROUTER DICTIONARY (Sankmo Configuration)
// Yahan manual control hai. Agar store idhar hai, toh Sankmo use hoga.
const sankmoCampaigns = {
    "Flipkart": "83956760",
    "Myntra": "16407658",
    "Ajio": "91411482",
    "Shopsy": "78454597",
    "Dot&Key": "80483577" // Aap yahan aur stores add kar sakte hain
};
const SANKMO_PUB_ID = "xPH2IO4";

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Login required!" }, { status: 401 });
    }

    const body = await req.json();
    const { action, deal } = body; 

    if (!deal || !deal.originalUrl) {
      return NextResponse.json({ success: false, message: "Invalid product data" }, { status: 400 });
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const dbUser = await User.findOne({ email: session.user.email });
    let safeUsername = "creator";
    let creatorTag = ""; 
    if (dbUser) {
      if (dbUser.username) safeUsername = dbUser.username.replace(/[^a-zA-Z0-9]/g, '');
      if (dbUser.amazonTag) creatorTag = dbUser.amazonTag.trim();
    } else {
      safeUsername = session.user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    }

    const rawLongUrl = deal.expandedUrl || deal.originalUrl;
    const cleanedUrl = cleanProductUrl(rawLongUrl);

    let existingPerformance = await LinkPerformance.findOne({
      creatorId: safeUsername,
      originalUrl: cleanedUrl 
    });

    let shortCodeToReturn = "";
    let affiliateUrlToUse = "";
    let finalStoreName = deal.storeName || "PlatformDeal";

    if (existingPerformance) {
      shortCodeToReturn = existingPerformance.shortCode;
      affiliateUrlToUse = existingPerformance.affiliateUrl;
    } else {
      shortCodeToReturn = Math.random().toString(36).substring(2, 8);

      let isAmazonLink = false;
      try {
          const checkUrl = new URL(cleanedUrl);
          isAmazonLink = checkUrl.hostname.includes('amazon') || checkUrl.hostname.includes('amzn');
      } catch(e) {}

      finalStoreName = isAmazonLink ? "Amazon" : finalStoreName;

      // ==========================================
      // 🚀 THE MASTER ROUTER ENGINE
      // ==========================================
      
      if (isAmazonLink && creatorTag) {
          // ROUTE 1: AMAZON (Direct Associate Tag)
          try {
              const amzUrl = new URL(cleanedUrl);
              amzUrl.searchParams.set('tag', creatorTag);
              affiliateUrlToUse = amzUrl.toString();
          } catch(e) {
              affiliateUrlToUse = cleanedUrl + (cleanedUrl.includes('?') ? '&' : '?') + `tag=${creatorTag}`;
          }
      } 
      else if (sankmoCampaigns[finalStoreName]) {
          // ROUTE 2: SANKMO (High Conversion Deep-linking)
          const campId = sankmoCampaigns[finalStoreName];
          // subid = Creator ID, subid1 = Platform Shortcode (Dono database link karne ke kaam aayenge)
          affiliateUrlToUse = `https://sankmo.in/track/click?pub_id=${SANKMO_PUB_ID}&camp_id=${campId}&subid=${safeUsername}&subid1=${shortCodeToReturn}&source=manual&dl=${encodeURIComponent(cleanedUrl)}`;
      } 
      else {
          // ROUTE 3: CUELINKS (The Ultimate Fallback for other stores)
          const pubId = (process.env.CUELINKS_PUB_ID || "246005").trim();
          affiliateUrlToUse = `https://linksredirect.com/?cid=${pubId}&source=getbuylink&subid=${safeUsername}&subid2=${shortCodeToReturn}&subid3=manual&url=${encodeURIComponent(cleanedUrl)}`;
      }

      // Save Tracking Database
      await LinkPerformance.create({
        creatorId: safeUsername,
        shortCode: shortCodeToReturn,
        subId: safeUsername,
        originalUrl: cleanedUrl,
        affiliateUrl: affiliateUrlToUse,
        title: deal.title,
        store: finalStoreName, 
        source: "manual",
        linkType: "platform",
        clicks: 0
      });
    }

    if (action === "push") {
      const existingGlobalDeal = await GlobalDeal.findOne({
        creatorId: session.user.email || session.user.id,
        originalUrl: deal.originalUrl 
      });

      if (!existingGlobalDeal) {
        await GlobalDeal.create({
          creatorId: session.user.email || session.user.id,
          source: "creator",
          linkType: "platform",
          originalUrl: deal.originalUrl,
          expandedUrl: `/go/${shortCodeToReturn}`, 
          shortCode: shortCodeToReturn, 
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