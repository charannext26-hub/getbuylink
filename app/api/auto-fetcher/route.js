import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const BROAD_CATEGORIES = [
  "Men's Fashion", "Women's Fashion", "Electronics & Mobiles", 
  "Beauty & Grooming", "Home & Kitchen", "Footwear", 
  "Accessories", "Grocery", "Kids Product", "Special Deals"
];

function formatPrice(rawPrice) {
  if (!rawPrice) return "";
  let cleanStr = String(rawPrice).replace(/rs\.?|rupees|price|₹/gi, "").trim();
  const numberMatch = cleanStr.match(/[\d,]+(\.\d+)?/);
  if (numberMatch) return `₹${numberMatch[0]}`; 
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
    const finalRawLink = await expandAndCleanUrl(rawLinkFromDDS); // 🚀 Cleaning process applied here!
    
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

          // 🚨 STRICT PROMPT MATCHED WITH TELEGRAM WEBHOOK
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
            6. couponCode: STRICTLY extract ONLY exact alphanumeric promo codes (e.g., "SAVE50"). DO NOT put sentences like "Apply 50% coupon" or "₹400 off with HDFC" here. Return "" if no exact code exists.
            7. description: Write 2 short paragraphs. Then, add exactly "Why buy this?" followed by 3-4 bullet points. IMPORTANT: If there are bank offers, card offers, or generic 'Apply X% off' coupons, add them exactly as the VERY LAST bullet point in bold. Ignore irrelevant text.
            8. saleEndTime: ISO 8601 format if expiry is present, else null.
            
            Respond ONLY with a valid JSON object matching these 8 keys.
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
          aiData.description = parsedAiData.description || aiData.description;
          aiData.saleEndTime = parsedAiData.saleEndTime || null;
          
          console.log(`✅ Auto-Fetcher AI Parsed Successfully!`);
          break; 
        } catch (error) {
          console.log(`⚠️ Model ${modelName} failed. Trying next...`);
        }
    }

    // 🚀 FALLBACK IMAGE: Agar image nahi aayi toh ek dummy deal image daal do
    const fallbackImage = "https://placehold.co/600x400/indigo/white?text=Mega+Deal";
    const finalImage = scrapedData.image && scrapedData.image.length > 5 ? scrapedData.image : fallbackImage;

    // 🚀 SAVE TO DB (Source & Creator locked to "telegram" for Frontend)
    const newDeal = await GlobalDeal.create({
      creatorId: "telegram_bot", // 🔒 Spoofing Telegram
      originalUrl: targetUrl, 
      expandedUrl: targetUrl, 
      rawAffiliateLink: finalRawLink, // 🔥 100% CLEAN LINK GOES HERE
      store: determinedStore !== "Unknown" ? determinedStore : "Unknown", 
      title: aiData.catchyTitle,
      image: finalImage, // 🔥 FIX: Ab kabhi 'Path image is required' wala error nahi aayega
      category: aiData.category, 
      price: aiData.price, 
      mrp: aiData.mrp, 
      discountPercent: aiData.discountPercent,
      couponCode: aiData.couponCode,
      source: "telegram", // 🔒 Spoofing Telegram
      description: aiData.description, 
      saleEndTime: aiData.saleEndTime 
    });

    console.log("✅ Auto Deal Saved Cleanly! Store:", newDeal.store);
    return NextResponse.json({ status: "success", dealId: newDeal._id }, { status: 200 });

  } catch (error) {
    console.error("❌ Auto-Fetcher Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 }); 
  }
}