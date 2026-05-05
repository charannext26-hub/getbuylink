import { NextResponse } from "next/server";
import { getServerSession } from "next-auth"; 
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import User from "@/lib/models/User";
import { generateAffiliateLink } from "@/lib/cuelinksEngine"; 
import LinkPerformance from "@/lib/models/LinkPerformance";

// 🚨 MASTER TRICK: The URL Cleaner (Bulletproof Version)
function cleanProductUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    // 1. Kachra text (jaise "Buy here:") hatakar sirf link nikalo
    let urlString = rawUrl.trim();
    const urlMatch = urlString.match(/(https?:\/\/[^\s]+)/);
    
    if (urlMatch) {
        urlString = urlMatch[1];
    } else if (!urlString.startsWith('http')) {
        urlString = 'https://' + urlString; // Agar http miss ho gaya toh jod do
    }

    const urlObj = new URL(urlString);
    const paramsToRemove = [
      'tag', 'linkCode', 'linkId', 'ref_', 'ascsubtag', // Amazon
      'affid', 'cmpid', 'affExtParam1', 'affExtParam2', // Flipkart/Myntra
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', // Analytics
      'subid', 'clickId', 'igshid', 'mibextid' // Social media
    ];
    paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
    return urlObj.toString();
  } catch (e) {
    return rawUrl; // Fail-safe
  }
}

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
    let finalAffiliateUrl = ""; // Ye LinkPerformance (Redirector) ke liye hai
    let finalStore = store || "Unknown";
    let generatedShortCode = "";
    
    // 🚨 NAYA: Ye wo link hai jo Bio page par button dabane par khulega!
    let bioPageUrl = ""; 

    if (usePlatformLink === true) {
      // ✅ PLATFORM LINK: Affiliate Generate karo
      finalOriginalUrl = cleanProductUrl(url);
      let cleanedExpandedUrl = expandedUrl ? cleanProductUrl(expandedUrl) : finalOriginalUrl;
      let longUrlForProcessing = (cleanedExpandedUrl.length > finalOriginalUrl.length) ? cleanedExpandedUrl : finalOriginalUrl;

      // 🚨 FIX: Shortcode pehle generate karenge taaki URL mein daal sakein!
      generatedShortCode = Math.random().toString(36).substring(2, 8);

      let isAmazonLink = false;
      try {
          const checkUrl = new URL(longUrlForProcessing);
          isAmazonLink = checkUrl.hostname.includes('amazon') || checkUrl.hostname.includes('amzn');
      } catch(e) {}

      finalStore = isAmazonLink ? "Amazon" : (store || "Unknown");

      if (isAmazonLink && creatorTag) {
          try {
              const amzUrl = new URL(longUrlForProcessing);
              amzUrl.searchParams.set('tag', creatorTag);
              finalAffiliateUrl = amzUrl.toString();
          } catch(e) {
              finalAffiliateUrl = longUrlForProcessing + (longUrlForProcessing.includes('?') ? '&' : '?') + `tag=${creatorTag}`;
          }
      } else {
          // 🚨 NAYA Cuelinks URL (With subid1 and subid2)
          const pubId = (process.env.CUELINKS_PUB_ID || "246005").trim();
          finalAffiliateUrl = `https://linksredirect.com/?cid=${pubId}&source=getbuylink&subid=${safeUsername}&subid2=${generatedShortCode}&subid3=manual&url=${encodeURIComponent(longUrlForProcessing)}`;
      }
      
      // 🚨 FIX: Bio page ab exactly is short code route par hi jayega!
      bioPageUrl = `/go/${generatedShortCode}`; 

    } else {
      // 🚫 OWN LINK: NO TOUCHING!
      finalOriginalUrl = url; 
      finalAffiliateUrl = url; 
      
      // 🚨 FIX 2: Bio page ab exactly wahi link kholega jo creator ne paste kiya tha (no expand!)
      bioPageUrl = url; 
    }

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
      expandedUrl: bioPageUrl, // 🚨 THE REAL MAGIC: Ab Bio page ko sirf yahi perfect link dikhega!
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
        shortCode: generatedShortCode,
        subId: safeUsername,
        affiliateUrl: finalAffiliateUrl, // Yahan asli affiliate link save hoga!
        originalUrl: finalOriginalUrl, 
        title: title,
        store: finalStore,
        source: "manual", 
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
    return NextResponse.json({ success: false, message: "Server error ho gaya!", error: error.message }, { status: 500 });
  }
}