import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
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
      // 🛑 SANITY CHECK: Agar price 5 Lakh se zyada hai, toh wo pakka kachra string ya phone number hai!
      if (numValue > 500000) return ""; 
      
      // Number ko wapas proper Indian comma format me convert kar do (e.g., 2,345)
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
  
  if (lowerText.includes("shirt") || lowerText.includes("jeans") || lowerText.includes("t-shirt") || lowerText.includes("mens")) return "Men's Fashion";
  if (lowerText.includes("saree") || lowerText.includes("kurti") || lowerText.includes("dress") || lowerText.includes("womens")) return "Women's Fashion";
  if (lowerText.includes("phone") || lowerText.includes("mobile") || lowerText.includes("earbud") || lowerText.includes("laptop")) return "Electronics & Mobiles";
  if (lowerText.includes("shoe") || lowerText.includes("sneaker") || lowerText.includes("sandal") || lowerText.includes("footwear")) return "Footwear";
  if (lowerText.includes("cream") || lowerText.includes("wash") || lowerText.includes("trimmer") || lowerText.includes("makeup")) return "Beauty & Grooming";
  if (lowerText.includes("kitchen") || lowerText.includes("cooker") || lowerText.includes("bottle") || lowerText.includes("home")) return "Home & Kitchen";
  if (lowerText.includes("bag") || lowerText.includes("sunglass") || lowerText.includes("belt") || lowerText.includes("wallet")) return "Accessories";
  if (lowerText.includes("grocery") || lowerText.includes("food") || lowerText.includes("snack") || lowerText.includes("tea")) return "Grocery";
  
  return "Special Deals";
}

function detectStore(link) {
    if (!link) return "Unknown";
    const lowLink = link.toLowerCase();
    if (lowLink.includes("amazon")) return "Amazon";
    if (lowLink.includes("flipkart")) return "Flipkart";
    if (lowLink.includes("shopsy")) return "Shopsy";
    if (lowLink.includes("myntra")) return "Myntra";
    if (lowLink.includes("ajio")) return "Ajio";
    return "Unknown";
}

// 🚀 NAYA ADD KIYA GAYA: URL EXPANDER & PARAMETER CLEANER
async function expandAndCleanUrl(shortUrl) {
    try {
        const response = await fetch(shortUrl, { method: 'HEAD', redirect: 'follow' });
        let finalUrl = response.url;

        const urlObj = new URL(finalUrl);
        // Deal sites ke saare tracking/affiliate tags hata do
        const paramsToRemove = ['tag', 'affid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ascsubtag', 'clid', 'gclid'];
        paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
        
        return urlObj.toString();
    } catch (error) {
        console.error("URL Expansion Error:", error.message);
        return shortUrl; 
    }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const targetUrl = body.url;

    if (!targetUrl) return NextResponse.json({ status: "ignored", reason: "No URL found" }, { status: 400 });

    if (!mongoose.connection.readyState) await mongoose.connect(process.env.MONGODB_URI);

    // 🚨 DUPLICATE CHECKER
    const existingDeal = await GlobalDeal.findOne({ originalUrl: targetUrl });
    if (existingDeal) return NextResponse.json({ status: "already_exists" }, { status: 200 });

    console.log(`🔥 New Deal Found via Hostinger! Processing: ${targetUrl}`);

    // 🌐 CALL DDS SCRAPER
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const ddsApiUrl = `${protocol}://${host}/api/dds-scraper?url=${encodeURIComponent(targetUrl)}`;
    
    let scrapedData = {};
    try {
        const ddsRes = await fetch(ddsApiUrl);
        const ddsJson = await ddsRes.json();
        if (ddsJson.success) scrapedData = ddsJson.data;
        else throw new Error("DDS Scraper failed");
    } catch (e) { 
        return NextResponse.json({ status: "scraper_failed" }, { status: 500 });
    }

    if (!scrapedData.title) return NextResponse.json({ status: "no_data_scraped" }, { status: 400 });

    // 🔥 THE URL WASHER: Raw link nikalna aur usko turant saaf karna
    const rawLinkFromDDS = scrapedData.bestRawLink && scrapedData.bestRawLink !== "Link still hidden." ? scrapedData.bestRawLink : targetUrl;
    const finalRawLink = await expandAndCleanUrl(rawLinkFromDDS); 

    // 🛑 THE ULTIMATE GATEKEEPER: Deal Sites Blocker
    const junkDomains = ['dealsmagnet.com', 'dealsspy.in', 'offertag.in', 'roobai.com', 'dealofthedayindia.com', 'earnkaro.com', 'linkredirect.in', 'cuelinks.com'];
    const isJunkLink = junkDomains.some(domain => finalRawLink.toLowerCase().includes(domain));
    
    if (isJunkLink || !finalRawLink.startsWith('http')) {
        console.log(`🚫 Gatekeeper Blocked: Raw link stuck on competitor domain -> ${finalRawLink}`);
        // Status 200 return karenge taaki webhook crash na ho, par deal save nahi hogi
        return NextResponse.json({ status: "blocked_competitor_link", reason: "Pure store link not found" }, { status: 200 });
    }

    const determinedStore = detectStore(finalRawLink);
    
    const scrapedDescription = scrapedData.description ? scrapedData.description.join(" ") : "";
    const extraOffers = scrapedData.extraOffers ? scrapedData.extraOffers.join(", ") : "";

    let aiData = {
      catchyTitle: scrapedData.title,
      category: guessCategory(scrapedData.title), 
      price: "", 
      mrp: "", 
      discountPercent: "",
      couponCode: "",
      description: "Best deal found online!",
      saleEndTime: null
    };

    // 🤖 AI BRAIN (With RPM Fallback)
    const AI_MODELS = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-flash"];
    
    for (const modelName of AI_MODELS) {
        try {
          console.log(`➡️ Auto-Fetcher trying AI Model: ${modelName}`);
          const model = genAI.getGenerativeModel({ 
              model: modelName,
              generationConfig: { responseMimeType: "application/json" }
          }); 

          const currentIsoTime = new Date().toISOString();

          // 🚨 ULTRA-STRICT PROMPT 
          const prompt = `
            Analyze this e-commerce deal.
            SCRAPED TITLE: "${scrapedData.title}"
            SCRAPED FEATURES/DESC: "${scrapedDescription}"
            BANK/COUPON OFFERS FOUND: "${extraOffers}"
            CURRENT TIME: "${currentIsoTime}"
            
            Task: Create a structured JSON output.
            1. catchyTitle: Clean, short, engaging title.
            2. category: Pick ONE from: ${JSON.stringify(BROAD_CATEGORIES)}.
            3. price: Extract the final price.
            4. mrp: Extract original MRP.
            5. discountPercent: Extract discount (e.g. "50%").
            6. couponCode: STRICTLY extract ONLY exact alphanumeric promo codes (e.g., "SAVE50"). Return "" if no exact code exists.
            7. cleanBankOffers: Extract ONLY genuine bank/card discounts or 'Apply coupon' text. STRICTLY REMOVE competitor site names like "DealsSpy", "OfferTag". Return "" if no real bank offer exists.
            8. description: Write 2 short paragraphs about the product. Then, add exactly "Why buy this?" followed by 3 short bullet points. DO NOT include bank offers here. **CRITICAL: Return this as a SINGLE STRING, NOT AN ARRAY.**
            9. saleEndTime: ISO 8601 format if expiry is present, else null.
            
            Respond ONLY with a valid JSON object matching these exactly 9 keys.
          `;

          const result = await model.generateContent(prompt);
          const parsedAiData = JSON.parse(result.response.text());
          
          aiData.catchyTitle = parsedAiData.catchyTitle || scrapedData.title;
          aiData.category = BROAD_CATEGORIES.includes(parsedAiData.category) ? parsedAiData.category : guessCategory(scrapedData.title); 
          
          // 🛡️ DATA LOCK (Priority to DDS Scraper data)
          aiData.price = formatPrice(scrapedData.offerPrice) || formatPrice(parsedAiData.price);
          aiData.mrp = formatPrice(scrapedData.mrp) || formatPrice(parsedAiData.mrp);
          aiData.discountPercent = formatDiscount(scrapedData.discountPercentage) || formatDiscount(parsedAiData.discountPercent);
          aiData.couponCode = parsedAiData.couponCode || "";
          aiData.saleEndTime = parsedAiData.saleEndTime || null;
          
          // 🔥 ARRAY FIX: Agar AI galti se Array de de, toh usko String me convert kar do
          let rawAiDesc = parsedAiData.description || "";
          if (Array.isArray(rawAiDesc)) {
              rawAiDesc = rawAiDesc.join("\n\n");
          }
          aiData.description = rawAiDesc;
          aiData.cleanBankOffers = parsedAiData.cleanBankOffers || "";

          console.log(`✅ Auto-Fetcher AI Parsed Successfully!`);
          break; 
        } catch (error) {
          console.log(`⚠️ Model ${modelName} failed. Trying next...`);
        }
    }

    // 🚀 SMART MERGE & SPLIT ENGINE
    
    // 1. DB (Bio Page) Ke Liye: 2 Paragraphs + Bullets + Bank Offers at the bottom
    let finalDescriptionForDB = aiData.description;
    if (aiData.cleanBankOffers) {
        finalDescriptionForDB += "\n\n**Extra Offers:** " + aiData.cleanBankOffers;
    }

    // 2. Telegram Ke Liye: Sirf "Why buy this?" ke neeche wale bullets nikal lo (No long paragraphs)
    let telegramDescOnlyBullets = aiData.description;
    const splitKeyword = telegramDescOnlyBullets.match(/Why buy this\?/i);
    if (splitKeyword) {
        telegramDescOnlyBullets = telegramDescOnlyBullets.split(splitKeyword[0])[1].trim();
    }

    // 🚀 FALLBACK IMAGE
    const fallbackImage = "https://placehold.co/600x400/indigo/white?text=Mega+Deal";
    const finalImage = scrapedData.image && scrapedData.image.length > 5 ? scrapedData.image : fallbackImage;

    // 🚀 SAVE TO DB (Source & Creator locked to "telegram" for Frontend)
    const newDeal = await GlobalDeal.create({
      creatorId: "telegram_bot", 
      originalUrl: targetUrl, 
      expandedUrl: targetUrl, 
      rawAffiliateLink: finalRawLink, 
      store: determinedStore !== "Unknown" ? determinedStore : "Unknown", 
      title: aiData.catchyTitle,
      image: finalImage,
      category: aiData.category, 
      price: aiData.price, 
      mrp: aiData.mrp, 
      discountPercent: aiData.discountPercent,
      couponCode: aiData.couponCode,
      source: "telegram", 
      description: finalDescriptionForDB, // 👈 DB me Pura Format Jayega (Bio Page ke liye)
      saleEndTime: aiData.saleEndTime 
    });

    // 🚀 THE MAGIC PUSH TO HOSTINGER
    try {
        console.log("Pushing deal to Hostinger Telegram Poster...");
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
                description: telegramDescOnlyBullets, // 👈 Telegram par SIRF Bullets jayenge!
                extraOffers: aiData.cleanBankOffers,  // 👈 Bank Offers alag se jayenge
                rawLink: newDeal.rawAffiliateLink,
                image: newDeal.image,
                store: newDeal.store
            })
        });
        console.log("✅ Successfully pushed to Hostinger!");
    } catch (pushErr) {
        console.error("⚠️ Failed to push to Hostinger:", pushErr.message);
    }

    console.log("✅ Auto Deal Saved Cleanly! Store:", newDeal.store);
    return NextResponse.json({ status: "success", dealId: newDeal._id }, { status: 200 });

  } catch (error) {
    console.error("❌ Auto-Fetcher Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 }); 
  }
}