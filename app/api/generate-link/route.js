import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import LinkPerformance from "@/lib/models/LinkPerformance";
import User from "@/lib/models/User"; 

// 🚨 MASTER TRICK: The URL Cleaner (Aur zyada strict kar diya gaya hai)
function cleanProductUrl(rawUrl) {
  try {
    const urlObj = new URL(rawUrl);
    const pureTrackingParams = [
      'tag', 'affid', 'ascsubtag', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'subid', 'gclid'
    ];
    
    pureTrackingParams.forEach(param => urlObj.searchParams.delete(param));
    return urlObj.toString();
  } catch (e) {
    return rawUrl; 
  }
}

// 🎯 STORE ROUTER DICTIONARY (Sankmo Configuration)
const sankmoCampaigns = {
    "Dot&Key": "80483577" 
};
const SANKMO_PUB_ID = "xPH2IO4";
// Apni asli site ka base URL yahan rakhein
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://favylink.com";

export async function POST(req) {
  try {
    if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);

    const { dealId, creatorUsername, triggerSource } = await req.json();

    const deal = await GlobalDeal.findById(dealId);
    if (!deal) return NextResponse.json({ success: false, message: "Deal not found" });

    const rawTargetUrl = (deal.rawAffiliateLink || deal.expandedUrl || deal.originalUrl || "").trim();
    if (!rawTargetUrl) return NextResponse.json({ success: false, message: "Product URL missing" });

    // CLEANING THE LINK
    const targetProductUrl = cleanProductUrl(rawTargetUrl);
    const safeSubId = creatorUsername ? creatorUsername.replace(/[^a-zA-Z0-9]/g, '') : "unknown";

    // ==========================================
    // 🛡️ STEP 1: FETCH USER PERMISSIONS & SET TAGS
    // ==========================================
    let creatorTag = "";
    let isAmazonShortlinkEnabled = false;

    if (creatorUsername) {
       const creatorData = await User.findOne({ username: creatorUsername }).select("amazonTag isAmazonShortlinkEnabled").lean();
       if (creatorData) {
           creatorTag = (creatorData.amazonTag || "").trim();
           isAmazonShortlinkEnabled = !!creatorData.isAmazonShortlinkEnabled;
       }
    }

    let isAmazonLink = false;
    try {
        const checkUrl = new URL(targetProductUrl);
        isAmazonLink = checkUrl.hostname.includes('amazon') || checkUrl.hostname.includes('amzn');
    } catch(e) {}

    // 🚀 THE MASTER FALLBACK LOGIC
    const ADMIN_AMZ_TAG = process.env.AMAZON_PARTNER_TAG || "979298807-21";
    let shouldProvideRawLink = false;
    let activeTagToUse = "";

    if (isAmazonLink) {
        if (creatorTag) {
            // Creator ka tag hai, unki settings follow karo
            activeTagToUse = creatorTag;
            shouldProvideRawLink = !isAmazonShortlinkEnabled;
        } else {
            // 🚨 Creator ka tag NAHI hai! Platform tag lagao aur tracking bypass karo.
            activeTagToUse = ADMIN_AMZ_TAG;
            shouldProvideRawLink = true; 
        }
    }

    // ==========================================
    // 🚨 STEP 2: EXISTING LINK CHECK
    // ==========================================
    let existingLink = await LinkPerformance.findOne({ 
      creatorId: safeSubId,
      $or: [{ globalDealId: dealId }, { originalUrl: targetProductUrl }]
    });

    if (existingLink && existingLink.shortCode) {
      let finalUrlToShare = `${BASE_URL}/go/${existingLink.shortCode}`;
      if (shouldProvideRawLink) {
          finalUrlToShare = existingLink.affiliateUrl; 
      }

      return NextResponse.json({ 
          success: true, 
          shortCode: existingLink.shortCode, 
          finalUrl: finalUrlToShare,        
          isRaw: shouldProvideRawLink,      
          message: "Existing link fetched" 
      });
    }

    // ==========================================
    // 🚨 STEP 3: CREATE NEW LINK
    // ==========================================
    const newShortCode = Math.random().toString(36).substring(2, 8);
    const finalStoreName = deal.store || (isAmazonLink ? "Amazon" : "Unknown");
    let affiliateUrl = "";
    
    if (isAmazonLink) {
        // ROUTE 1: AMAZON (Creator Tag ya Admin Tag)
        try {
            const amzUrl = new URL(targetProductUrl);
            amzUrl.searchParams.set('tag', activeTagToUse); 
            affiliateUrl = amzUrl.toString();
        } catch(e) {
            affiliateUrl = targetProductUrl + (targetProductUrl.includes('?') ? '&' : '?') + `tag=${activeTagToUse}`;
        }
    } 
    else if (sankmoCampaigns[finalStoreName]) {
        // ROUTE 2: SANKMO
        const campId = sankmoCampaigns[finalStoreName];
        affiliateUrl = `https://sankmo.in/track/click?pub_id=${SANKMO_PUB_ID}&camp_id=${campId}&subid=${safeSubId}&subid1=${newShortCode}&source=telegram_auto_post&dl=${encodeURIComponent(targetProductUrl)}`;
    } 
    else {
        // ROUTE 3: CUELINKS
        const pubId = (process.env.CUELINKS_PUB_ID || "246005").trim();
        affiliateUrl = `https://linksredirect.com/?cid=${pubId}&source=getbuylink&subid=${safeSubId}&subid2=${newShortCode}&subid3=telegram&url=${encodeURIComponent(targetProductUrl)}`;
    }
    
    const finalSource = triggerSource === "bio_page" ? "telegram" : "auto-post-share";

    // 💾 SAVE TO DB (Click tracking aur Dashboard ke liye)
    // 🚀 THE FIX: Agar Raw link dena hai, toh DB mein save mat karo!
    if (!shouldProvideRawLink) {
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
    }

    // 📤 FINAL RESPONSE
    let finalUrlToShare = `${BASE_URL}/go/${newShortCode}`;
    if (shouldProvideRawLink) {
        finalUrlToShare = affiliateUrl; // Agar Amazon + Non-verified, toh Raw Link bhejo
    }

    return NextResponse.json({ 
        success: true, 
        shortCode: newShortCode, 
        finalUrl: finalUrlToShare, 
        isRaw: shouldProvideRawLink,
        message: "New link generated" 
    });

  } catch (error) {
    console.error("Link Gen Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}