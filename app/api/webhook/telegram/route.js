import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import { getOgTags } from "@/lib/scraper";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const BROAD_CATEGORIES = [
  "Men's Fashion", "Women's Fashion", "Mobiles & Electronics", 
  "Beauty & Personal Care", "Home & Kitchen", "Footwear & Bags", 
  "Watches & Accessories", "Baby & Kids", "Health & Fitness", 
  "Grocery & Essentials", "Sports & Outdoors", "Books & Stationery", 
  "Special Deals"
];

function formatPrice(rawPrice) {
  if (!rawPrice) return "";
  let cleanStr = String(rawPrice).replace(/rs\.?|rupees|price|₹|,/gi, "").trim();
  const numberMatch = cleanStr.match(/\d+(\.\d+)?/);
  
  if (numberMatch) {
      const numValue = parseInt(numberMatch[0], 10);
      // 🛑 SANITY CHECK
      if (numValue > 500000) return ""; 
      return `₹${numValue.toLocaleString('en-IN')}`; 
  }
  return ""; 
}

function formatDiscount(rawDiscount) {
  if (!rawDiscount) return "";
  let cleanStr = String(rawDiscount).toUpperCase().replace(/\s*OFF\s*/g, "").trim();
  const numberMatch = cleanStr.match(/(\d+)/);
  if (numberMatch) return `${numberMatch[1]}% OFF`; 
  return ""; 
}

function guessCategory(text) {
  if (!text) return "Other";
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("shirt") || lowerText.includes("jeans") || lowerText.includes("t-shirt") || lowerText.includes("mens") || lowerText.includes("men's")) return "Men's Fashion";
  if (lowerText.includes("saree") || lowerText.includes("kurti") || lowerText.includes("dress") || lowerText.includes("womens") || lowerText.includes("women's")) return "Women's Fashion";
  if (lowerText.includes("phone") || lowerText.includes("mobile") || lowerText.includes("earbud") || lowerText.includes("laptop") || lowerText.includes("watch") || lowerText.includes("smartwatch")) return "Electronics & Mobiles";
  if (lowerText.includes("shoe") || lowerText.includes("sneaker") || lowerText.includes("sandal") || lowerText.includes("slipper") || lowerText.includes("footwear") || lowerText.includes("crocs")) return "Footwear";
  if (lowerText.includes("cream") || lowerText.includes("wash") || lowerText.includes("trimmer") || lowerText.includes("perfume") || lowerText.includes("makeup") || lowerText.includes("serum")) return "Beauty & Grooming";
  if (lowerText.includes("kitchen") || lowerText.includes("cooker") || lowerText.includes("bottle") || lowerText.includes("home") || lowerText.includes("gas")) return "Home & Kitchen";
  if (lowerText.includes("bag") || lowerText.includes("sunglass") || lowerText.includes("belt") || lowerText.includes("wallet") || lowerText.includes("luggage")) return "Accessories";
  if (lowerText.includes("grocery") || lowerText.includes("food") || lowerText.includes("snack") || lowerText.includes("tea") || lowerText.includes("coffee")) return "Grocery";
  
  return "Special Deals";
}

async function expandAndCleanUrl(shortUrl) {
    try {
        const response = await fetch(shortUrl, { method: 'HEAD', redirect: 'follow' });
        let finalUrl = response.url;

        const urlObj = new URL(finalUrl);
        const paramsToRemove = ['tag', 'affid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ascsubtag', 'clid', 'gclid'];
        paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
        
        return urlObj.toString();
    } catch (error) {
        return shortUrl; 
    }
}

// 🏢 STORE DETECTOR LOGIC (Smart Version)
function detectStore(link, origLink = "") {
    const lowLink = (link || "").toLowerCase();
    const lowOrig = (origLink || "").toLowerCase();
    
    if (lowOrig.includes("shopsy") || lowLink.includes("shopsy")) return "Shopsy";
    if (lowOrig.includes("amazon") || lowOrig.includes("amzn") || lowLink.includes("amazon") || lowLink.includes("amzn")) return "Amazon";
    if (lowOrig.includes("flipkart") || lowLink.includes("flipkart")) return "Flipkart";
    if (lowOrig.includes("myntra") || lowLink.includes("myntra")) return "Myntra";
    if (lowOrig.includes("ajio") || lowLink.includes("ajio")) return "Ajio";
    
    return "Unknown";
}

export async function POST(req) {
  try {
    const body = await req.json();
    let text = "";
    const msg = body.message || body.channel_post || body.edited_message || body.edited_channel_post;
    if (msg) text = msg.text || msg.caption || "";
    if (!text) return NextResponse.json({ status: "ignored", reason: "No text found" }, { status: 200 });

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    if (!urls || urls.length === 0) return NextResponse.json({ status: "no_url" }, { status: 200 });

    const originalUrl = urls[0];
    const expandedUrl = await expandAndCleanUrl(originalUrl);
    const urlObj = new URL(expandedUrl);
    const hostname = urlObj.hostname.toLowerCase();

    let scrapedData = {};
    let isDDS = false;
    let finalRawLink = expandedUrl;
    let finalMrp = "";

    // 🌐 ROUTING
    if (hostname.includes("dealsmagnet.com") || hostname.includes("dealsspy.in") || hostname.includes("shopsy.in") || hostname.includes("offertag.in") || hostname.includes("roobai.com") || hostname.includes("dealofthedayindia.com")) {
        console.log("➡️ Routing to DDS Scraper...");
        isDDS = true;
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host");
        const ddsApiUrl = `${protocol}://${host}/api/dds-scraper?url=${encodeURIComponent(expandedUrl)}`;
        try {
            const ddsRes = await fetch(ddsApiUrl);
            const ddsJson = await ddsRes.json();
            if (ddsJson.success) scrapedData = ddsJson.data;
        } catch (e) { console.error("DDS Scraper failed"); }
    } else {
        console.log("➡️ Routing to Legacy Scraper...");
        scrapedData = await getOgTags(expandedUrl);
    }

    const ogTitle = isDDS ? (scrapedData.title || "Exclusive Deal") : ((scrapedData.success && scrapedData.title) ? scrapedData.title : "Exclusive Deal");
    const fallbackImage = "https://placehold.co/600x400/indigo/white?text=Mega+Deal";
    const finalImage = isDDS ? (scrapedData.image || fallbackImage) : ((scrapedData.success && scrapedData.image) ? scrapedData.image : fallbackImage);
    
    const scraperPrice = isDDS ? scrapedData.offerPrice : ((scrapedData.success && scrapedData.price) ? scrapedData.price : "");
    const scraperDiscount = isDDS ? scrapedData.discountPercentage : ((scrapedData.success && scrapedData.discountPercent) ? scrapedData.discountPercent : "");
    finalMrp = isDDS ? scrapedData.mrp : ""; 
    
    if (isDDS && scrapedData.bestRawLink && scrapedData.bestRawLink !== "Link still hidden.") {
        finalRawLink = scrapedData.bestRawLink;
    }

    // 🛑 THE ULTIMATE GATEKEEPER (Junk Domain Blocker)
    const junkDomains = ['dealsmagnet.com', 'dealsspy.in', 'offertag.in', 'roobai.com', 'dealofthedayindia.com', 'earnkaro.com', 'linkredirect.in', 'cuelinks.com'];
    const isJunkLink = junkDomains.some(domain => finalRawLink.toLowerCase().includes(domain));
    
    if (isJunkLink || !finalRawLink.startsWith('http')) {
        console.log(`🚫 Gatekeeper Blocked: Raw link stuck on competitor domain -> ${finalRawLink}`);
        return NextResponse.json({ status: "blocked_competitor_link", reason: "Pure store link not found" }, { status: 200 });
    }

    // 🔥 Exact Store Name Logic 
    const determinedStore = detectStore(finalRawLink, originalUrl);

    const scrapedDescription = isDDS && scrapedData.description ? scrapedData.description.join(" ") : "";
    const extraOffers = isDDS && scrapedData.extraOffers ? scrapedData.extraOffers.join(", ") : "";

    let aiData = {
      catchyTitle: ogTitle,
      category: guessCategory(text + " " + ogTitle), 
      price: "", mrp: "", discountPercent: "", couponCode: "",
      description: "An amazing deal!", saleEndTime: null, cleanBankOffers: ""
    };

    // 🤖 AI BRAIN (With RPM Fallback & Array Fix)
    const AI_MODELS = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-flash"];
    let aiSuccess = false;

    for (const modelName of AI_MODELS) {
        try {
          console.log(`➡️ Trying AI Model: ${modelName}`);
          const model = genAI.getGenerativeModel({ 
              model: modelName,
              generationConfig: { responseMimeType: "application/json" }
          }); 

          const currentIsoTime = new Date().toISOString();

          // 🚨 ULTRA-STRICT PROMPT (Matching Auto-Fetcher)
          const prompt = `
            Analyze this e-commerce deal.
            TELEGRAM ORIGINAL POST: "${text}"
            SCRAPED TITLE: "${ogTitle}"
            SCRAPED FEATURES/DESC: "${scrapedDescription}"
            BANK/COUPON OFFERS FOUND: "${extraOffers}"
            CURRENT TIME: "${currentIsoTime}"
            
            Task: Create a structured JSON output.
            1. catchyTitle: Clean, short, engaging title.
            2. category: Pick ONE from: ${JSON.stringify(BROAD_CATEGORIES)}.
            3. price: Extract the final price.
            4. mrp: Extract original MRP.
            5. discountPercent: Extract discount (e.g. "50%").
            6. couponCode: STRICTLY extract ONLY exact alphanumeric promo codes. Return "" if no exact code exists.
            7. cleanBankOffers: Extract ONLY genuine bank/card discounts or 'Apply coupon' text. STRICTLY REMOVE competitor site names like "DealsSpy", "OfferTag". Return "" if no real bank offer exists.
            8. description: Write 2 short paragraphs about the product. Then, add exactly "Why buy this?" followed by 3 short bullet points. DO NOT include bank offers here. **CRITICAL: Return this as a SINGLE STRING, NOT AN ARRAY.**
            9. saleEndTime: ISO 8601 format if expiry is present, else null.
            
            Respond ONLY with a valid JSON object matching these exactly 9 keys.
          `;

          const result = await model.generateContent(prompt);
          const parsedAiData = JSON.parse(result.response.text());
          
          aiData.catchyTitle = parsedAiData.catchyTitle || ogTitle;
          aiData.category = BROAD_CATEGORIES.includes(parsedAiData.category) ? parsedAiData.category : guessCategory(text + " " + ogTitle); 
          
          aiData.price = isDDS && scraperPrice ? formatPrice(scraperPrice) : formatPrice(parsedAiData.price || scraperPrice);
          aiData.mrp = isDDS && finalMrp ? formatPrice(finalMrp) : formatPrice(parsedAiData.mrp || "");
          aiData.discountPercent = isDDS && scraperDiscount ? formatDiscount(scraperDiscount) : formatDiscount(parsedAiData.discountPercent || scraperDiscount);
          
          aiData.couponCode = parsedAiData.couponCode || "";
          aiData.saleEndTime = parsedAiData.saleEndTime || null;
          aiData.cleanBankOffers = parsedAiData.cleanBankOffers || "";

          // 🔥 ARRAY FIX: Agar AI galti se Array de de
          let rawAiDesc = parsedAiData.description || "";
          if (Array.isArray(rawAiDesc)) {
              rawAiDesc = rawAiDesc.join("\n\n");
          }
          aiData.description = rawAiDesc;
          
          console.log(`✅ AI Parsed Successfully!`);
          aiSuccess = true;
          break; 
        } catch (error) {
          console.log(`⚠️ Model ${modelName} failed due to limits. Trying next...`);
        }
    }

    if (!mongoose.connection.readyState) await mongoose.connect(process.env.MONGODB_URI);

    // 🚀 SMART MERGE & SPLIT ENGINE
    
    // 1. DB (Bio Page) Ke Liye: 2 Paragraphs + Bullets + Extra Offers
    let finalDescriptionForDB = aiData.description;
    if (aiData.cleanBankOffers) {
        finalDescriptionForDB += "\n\n**Extra Offers:** " + aiData.cleanBankOffers;
    }

    // 2. Hostinger (WhatsApp/Telegram) Ke Liye: Sirf Bullets
    let telegramDescOnlyBullets = aiData.description;
    const splitKeyword = telegramDescOnlyBullets.match(/Why buy this\?/i);
    if (splitKeyword) {
        telegramDescOnlyBullets = telegramDescOnlyBullets.split(splitKeyword[0])[1].trim();
    }

    // 🚀 SAVE TO DB
    const newDeal = await GlobalDeal.create({
      creatorId: "telegram_bot",
      originalUrl: originalUrl, 
      expandedUrl: expandedUrl, 
      rawAffiliateLink: finalRawLink, 
      store: determinedStore !== "Unknown" ? determinedStore : (scrapedData.store || "Unknown"), 
      title: aiData.catchyTitle,
      image: finalImage,
      category: aiData.category, 
      price: aiData.price, 
      mrp: aiData.mrp, 
      discountPercent: aiData.discountPercent,
      couponCode: aiData.couponCode,
      source: "telegram", 
      description: finalDescriptionForDB, // 👈 DB me merged content
      saleEndTime: aiData.saleEndTime 
    });

    // 🛑 STORES TO BLOCK FROM TELEGRAM/WHATSAPP (Hostinger Push)
    const blockedStoresForPush = ["shopsy", "meesho"]; 
    const currentStore = (newDeal.store || "").toLowerCase();

    if (blockedStoresForPush.includes(currentStore)) {
        console.log(`⏭️ Skipped Hostinger Push: Store '${newDeal.store}' is currently blocked for Telegram/WhatsApp.`);
    } else {
        // 🚀 THE MAGIC PUSH TO HOSTINGER
        try {
            console.log("Pushing Webhook Deal to Hostinger Telegram Poster...");
            await fetch("https://cb.metrovatech.com/telegram-poster.php", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "x-secret-key": "FavyLinkPro2026" 
                },
                body: JSON.stringify({
                    title: newDeal.title,
                    price: newDeal.price,
                    mrp: newDeal.mrp,
                    discount: newDeal.discountPercent,
                    coupon: newDeal.couponCode,
                    description: telegramDescOnlyBullets, 
                    extraOffers: aiData.cleanBankOffers,  
                    rawLink: newDeal.rawAffiliateLink,
                    image: newDeal.image,
                    store: newDeal.store
                })
            });
            console.log("✅ Successfully pushed Webhook Deal to Hostinger!");
        } catch (pushErr) {
            console.error("⚠️ Failed to push Webhook Deal to Hostinger:", pushErr.message);
        }
    }

    return NextResponse.json({ success: true, dealId: newDeal._id }, { status: 200 });
  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 }); 
  }
}