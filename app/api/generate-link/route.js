import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import LinkPerformance from "@/lib/models/LinkPerformance";
import User from "@/lib/models/User"; 

// 🚨 MASTER TRICK: The URL Cleaner
function cleanProductUrl(rawUrl) {
  try {
    const urlObj = new URL(rawUrl);
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
const sankmoCampaigns = {
    "Flipkart": "83956760",
    "Myntra": "16407658",
    "Ajio": "91411482",
    "Shopsy": "78454597",
    "Dot&Key": "80483577" 
};
const SANKMO_PUB_ID = "xPH2IO4";

export async function POST(req) {
  try {
    if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);

    const { dealId, creatorUsername, triggerSource } = await req.json();

    const deal = await GlobalDeal.findById(dealId);
    if (!deal) return NextResponse.json({ success: false, message: "Deal not found" });

    const rawTargetUrl = (deal.expandedUrl || deal.originalUrl || "").trim();
    if (!rawTargetUrl) return NextResponse.json({ success: false, message: "Product URL missing" });

    // CLEANING THE LINK
    const targetProductUrl = cleanProductUrl(rawTargetUrl);

    // Username ko safe banao
    const safeSubId = creatorUsername ? creatorUsername.replace(/[^a-zA-Z0-9]/g, '') : "unknown";

    // 🚨 MASTER PLAN STEP 1: Deal ID se existing link dhundhna
    let existingLink = await LinkPerformance.findOne({ 
      creatorId: safeSubId,
      $or: [
        { globalDealId: dealId }, 
        { originalUrl: targetProductUrl } 
      ]
    });

    if (existingLink && existingLink.shortCode) {
      return NextResponse.json({ success: true, shortCode: existingLink.shortCode, message: "Existing link fetched" });
    }

    // ==========================================
    // AGAR NAHI HAI, TOH New BANAO (First Time)
    // ==========================================

    let creatorTag = "";
    if (creatorUsername) {
       const creatorData = await User.findOne({ username: creatorUsername }).select("amazonTag").lean();
       if (creatorData && creatorData.amazonTag) {
           creatorTag = creatorData.amazonTag.trim();
       }
    }

    let isAmazonLink = false;
    try {
        const checkUrl = new URL(targetProductUrl);
        isAmazonLink = checkUrl.hostname.includes('amazon') || checkUrl.hostname.includes('amzn');
    } catch(e) {}

    let affiliateUrl = "";
    const newShortCode = Math.random().toString(36).substring(2, 8);
    const finalStoreName = deal.store || (isAmazonLink ? "Amazon" : "Unknown");

    // ==========================================
    // 🚀 THE MASTER ROUTER ENGINE (Sankmo + Cuelinks)
    // ==========================================
    
    if (isAmazonLink && creatorTag) {
        // ROUTE 1: AMAZON
        try {
            const amzUrl = new URL(targetProductUrl);
            amzUrl.searchParams.set('tag', creatorTag); 
            affiliateUrl = amzUrl.toString();
        } catch(e) {
            affiliateUrl = targetProductUrl + (targetProductUrl.includes('?') ? '&' : '?') + `tag=${creatorTag}`;
        }
    } 
    else if (sankmoCampaigns[finalStoreName]) {
        // ROUTE 2: SANKMO (Deep-linking integration for Telegram auto-post traffic)
        const campId = sankmoCampaigns[finalStoreName];
        affiliateUrl = `https://sankmo.in/track/click?pub_id=${SANKMO_PUB_ID}&camp_id=${campId}&subid=${safeSubId}&subid1=${newShortCode}&source=telegram_auto_post&dl=${encodeURIComponent(targetProductUrl)}`;
    } 
    else {
        // ROUTE 3: CUELINKS (Fallback)
        const pubId = (process.env.CUELINKS_PUB_ID || "246005").trim();
        affiliateUrl = `https://linksredirect.com/?cid=${pubId}&source=getbuylink&subid=${safeSubId}&subid2=${newShortCode}&subid3=telegram&url=${encodeURIComponent(targetProductUrl)}`;
    }
    
    const finalSource = triggerSource === "bio_page" ? "telegram" : "auto-post-share";

    // 🚨 MASTER PLAN STEP 2: Save 'globalDealId' in DB
    await LinkPerformance.create({
      creatorId: safeSubId,
      globalDealId: dealId,
      shortCode: newShortCode,
      subId: safeSubId,
      originalUrl: targetProductUrl, 
      affiliateUrl: affiliateUrl, 
      title: deal.title,
      store: finalStoreName,
      source: finalSource,
      linkType: "platform",
      clicks: 0
    });

    return NextResponse.json({ success: true, shortCode: newShortCode, message: "New link generated" });
  } catch (error) {
    console.error("Link Gen Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}