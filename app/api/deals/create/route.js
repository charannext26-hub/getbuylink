import { NextResponse } from "next/server";
import { getServerSession } from "next-auth"; 
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import User from "@/lib/models/User";
import LinkPerformance from "@/lib/models/LinkPerformance";

// 🚨 MASTER TRICK: The URL Cleaner (Bulletproof Version)
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

// 🎯 CASE-INSENSITIVE STORE DICTIONARY (Sankmo Configuration)
const sankmoCampaigns = {
    "flipkart": "83956760",
    "myntra": "16407658",
    "ajio": "91411482",
    
    "dot&key": "80483577"
};
const SANKMO_PUB_ID = "xPH2IO4";

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Login required!" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      url, expandedUrl, store, title, image, price, discountPercent, couponCode, saleEndTime, 
      videoUrl, category, collectionName, usePlatformLink, batchId 
    } = body;

    if (!url || !title) {
      return NextResponse.json({ success: false, message: "Data incomplete hai!" }, { status: 400 });
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const creatorIdToCheck = session.user.email || session.user.id;
    const dbUser = await User.findOne({ email: session.user.email });
    
    let safeUsername = "creator";
    let creatorTag = ""; 

    if (dbUser) {
      if (dbUser.username) safeUsername = dbUser.username.replace(/[^a-zA-Z0-9]/g, '');
      if (dbUser.amazonTag) creatorTag = dbUser.amazonTag.trim();
    } else if (session.user.email) {
      safeUsername = session.user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    }

    let finalOriginalUrl = url;
    let finalAffiliateUrl = ""; 
    let finalStore = store || "Unknown";
    let generatedShortCode = "";
    let bioPageUrl = ""; 

    if (usePlatformLink === true) {
      // ✅ PLATFORM LINK: Affiliate Generate karo
      finalOriginalUrl = cleanProductUrl(url);
      let cleanedExpandedUrl = expandedUrl ? cleanProductUrl(expandedUrl) : finalOriginalUrl;
      let longUrlForProcessing = (cleanedExpandedUrl.length > finalOriginalUrl.length) ? cleanedExpandedUrl : finalOriginalUrl;

      // 🚨 TEMPORARY MEESHO BLOCK LOGIC RESTORED
      let isMeeshoLink = false;
      try {
          const checkUrl = new URL(longUrlForProcessing);
          isMeeshoLink = checkUrl.hostname.includes('meesho') || checkUrl.hostname.includes('ltl.sh');
      } catch(e) {}

      // FinalStore verify karo pehle
      finalStore = isMeeshoLink ? "Meesho" : (store || "Unknown");

      if (isMeeshoLink || finalStore.toLowerCase() === "meesho") {
          return NextResponse.json({ 
              success: false, 
              message: "Meesho monetization is temporarily paused! Please turn off 'Platform Link' and use your 'Own Link' for Meesho products." 
          }, { status: 400 });
      }

      generatedShortCode = Math.random().toString(36).substring(2, 8);

      let isAmazonLink = false;
      try {
          const checkUrl = new URL(longUrlForProcessing);
          isAmazonLink = checkUrl.hostname.includes('amazon') || checkUrl.hostname.includes('amzn');
      } catch(e) {}

      finalStore = isAmazonLink ? "Amazon" : finalStore;
      const storeKey = finalStore.toLowerCase().trim();

      // ==========================================
      // 🚀 THE MASTER ROUTER ENGINE (Sankmo + Cuelinks)
      // ==========================================
      if (isAmazonLink && creatorTag) {
          try {
              const amzUrl = new URL(longUrlForProcessing);
              amzUrl.searchParams.set('tag', creatorTag);
              finalAffiliateUrl = amzUrl.toString();
          } catch(e) {
              finalAffiliateUrl = longUrlForProcessing + (longUrlForProcessing.includes('?') ? '&' : '?') + `tag=${creatorTag}`;
          }
      } else if (sankmoCampaigns[storeKey]) {
          // ROUTE 2: SANKMO
          const campId = sankmoCampaigns[storeKey];
          // Notice: 'source=manual' is used here now
          finalAffiliateUrl = `https://sankmo.in/track/click?pub_id=${SANKMO_PUB_ID}&camp_id=${campId}&subid=${safeUsername}&subid1=${generatedShortCode}&source=manual&dl=${encodeURIComponent(longUrlForProcessing)}`;
      } else {
          // ROUTE 3: CUELINKS (Fallback)
          const pubId = (process.env.CUELINKS_PUB_ID || "246005").trim();
          finalAffiliateUrl = `https://linksredirect.com/?cid=${pubId}&source=getbuylink&subid=${safeUsername}&subid2=${generatedShortCode}&subid3=manual&url=${encodeURIComponent(longUrlForProcessing)}`;
      }
      
      bioPageUrl = `/go/${generatedShortCode}`; 

    } else {
      // 🚫 OWN LINK: Direct Routing
      finalOriginalUrl = url; 
      finalAffiliateUrl = url; 
      bioPageUrl = url; 
    }

    // 🚨 DUPLICATE LINK PROTECTION (Purane location par wapas)
    const existingDeal = await GlobalDeal.findOne({ originalUrl: finalOriginalUrl, creatorId: creatorIdToCheck });
    if (existingDeal) {
        return NextResponse.json({ success: false, message: "Yeh deal pehle hi add ho chuki hai!" }, { status: 400 });
    }
    
    const isVideoDeal = videoUrl && videoUrl.trim() !== "";
    const isCollectionDeal = collectionName && collectionName.trim() !== "";
    const finalBatchId = (isVideoDeal || isCollectionDeal) && batchId ? batchId : "";

    // 9. GlobalDeal Database mein Save Karna
    const newDeal = new GlobalDeal({
      creatorId: creatorIdToCheck,
      source: "creator", 
      linkType: usePlatformLink ? "platform" : "own",
      batchId: finalBatchId,
      originalUrl: finalOriginalUrl, 
      expandedUrl: bioPageUrl, 
      shortCode: generatedShortCode, 
      store: finalStore,
      title: title,
      image: image,
      price: price || "",
      discountPercent: discountPercent || "",
      couponCode: couponCode || "",
      category: category || "Other",
      collectionName: collectionName || "", 
      videoUrl: isVideoDeal ? videoUrl : "", 
      saleEndTime: saleEndTime ? new Date(saleEndTime) : null, 
      isExpired: false,
    });

    await newDeal.save();
    
    // 10. Redirect tracking ke liye Lamba Link yahan save hoga
    if (usePlatformLink === true) {
      await LinkPerformance.create({
        creatorId: safeUsername,
        globalDealId: newDeal._id.toString(), // Sync ID
        shortCode: generatedShortCode,
        subId: safeUsername,
        affiliateUrl: finalAffiliateUrl, 
        originalUrl: finalOriginalUrl, 
        title: title,
        store: finalStore,
        source: "manual", // 👈 THE FIX: "addlink_page" ko wapas "manual" kar diya gaya hai!
        linkType: "platform",
        clicks: 0
      });
    }

    return NextResponse.json({ 
        success: true, 
        message: "Deal Saved!", 
        deal: newDeal,
        shortCode: generatedShortCode 
    }, { status: 201 });

  } catch (error) {
    console.error("Deal Create API Error:", error);
    return NextResponse.json({ success: false, message: "Server error ho gaya!", error: error.message }, { status: 500 });
  }
}