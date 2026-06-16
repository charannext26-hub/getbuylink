import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import { getOgTags } from "@/lib/scraper";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const BROAD_CATEGORIES = [
  "Men's Fashion", "Women's Fashion", "Electronics & Mobiles", 
  "Beauty & Grooming", "Home & Kitchen", "Footwear", 
  "Accessories", "Grocery", "Kids Product", "Special Deals"
];

// 🧹 THE PRICE CLEANER
function formatPrice(rawPrice) {
  if (!rawPrice) return "";
  let cleanStr = String(rawPrice).replace(/rs\.?|rupees|price|₹/gi, "").trim();
  const numberMatch = cleanStr.match(/[\d,]+(\.\d+)?/);
  if (numberMatch) {
      return `₹${numberMatch[0]}`; 
  }
  return ""; 
}

// 🧹 THE DISCOUNT CLEANER
function formatDiscount(rawDiscount) {
  if (!rawDiscount) return "";
  let cleanStr = String(rawDiscount).toUpperCase().replace(/\s*OFF\s*/g, "").trim();
  const numberMatch = cleanStr.match(/(\d+)/);
  if (numberMatch) {
      return `${numberMatch[1]}% OFF`; 
  }
  return ""; 
}

// 🧠 THE SMART CATEGORY ENGINE
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

// 🚀 URL EXPANDER & PARAMETER CLEANER
async function expandAndCleanUrl(shortUrl) {
    try {
        const response = await fetch(shortUrl, { method: 'HEAD', redirect: 'follow' });
        let finalUrl = response.url;

        const urlObj = new URL(finalUrl);
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

    // 🌐 THE SMART ROUTER
    if (hostname.includes("dealsmagnet.com") || hostname.includes("dealsspy.in") || hostname.includes("shopsy.in")) {
        console.log("➡️ Routing to New DDS Scraper...");
        isDDS = true;
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host");
        const ddsApiUrl = `${protocol}://${host}/api/dds-scraper?url=${encodeURIComponent(expandedUrl)}`;
        
        try {
            const ddsRes = await fetch(ddsApiUrl);
            const ddsJson = await ddsRes.json();
            if (ddsJson.success) scrapedData = ddsJson.data;
        } catch (e) { console.error("DDS Scraper failed:", e); }
    } else {
        console.log("➡️ Routing to Legacy Scraper (getOgTags)...");
        scrapedData = await getOgTags(expandedUrl);
    }

    // 📦 CORE DATA EXTRACTION
    const ogTitle = isDDS ? (scrapedData.title || "Exclusive Deal") : ((scrapedData.success && scrapedData.title) ? scrapedData.title : "Exclusive Deal");
    const fallbackImage = "https://placehold.co/600x400/indigo/white?text=Mega+Deal";
    const finalImage = isDDS ? (scrapedData.image || fallbackImage) : ((scrapedData.success && scrapedData.image) ? scrapedData.image : fallbackImage);
    
    // 🔥 DDS FIREWALL: In variables ko AI change nahi kar payega agar ye isDDS se aaye hain
    const scraperPrice = isDDS ? scrapedData.offerPrice : ((scrapedData.success && scrapedData.price) ? scrapedData.price : "");
    const scraperDiscount = isDDS ? scrapedData.discountPercentage : ((scrapedData.success && scrapedData.discountPercent) ? scrapedData.discountPercent : "");
    finalMrp = isDDS ? scrapedData.mrp : ""; 
    
    if (isDDS && scrapedData.bestRawLink && scrapedData.bestRawLink !== "Link still hidden.") {
        finalRawLink = scrapedData.bestRawLink;
    }

    const scrapedDescription = isDDS && scrapedData.description ? scrapedData.description.join(" ") : "";
    const extraOffers = isDDS && scrapedData.extraOffers ? scrapedData.extraOffers.join(", ") : "";

    let aiData = {
      catchyTitle: ogTitle,
      category: guessCategory(text + " " + ogTitle), 
      price: "", 
      mrp: "",
      discountPercent: "", 
      couponCode: "",
      description: "An amazing handpicked deal. Click to grab it before the offer ends!",
      saleEndTime: null
    };

    // 🤖 THE AI BRAIN
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

          // 🚨 STRICT PROMPT: Exact instructions for Coupon vs Bank Offers
          const prompt = `
            Analyze this e-commerce deal.
            TELEGRAM ORIGINAL POST: "${text}"
            SCRAPED TITLE: "${ogTitle}"
            SCRAPED FEATURES/DESC: "${scrapedDescription}"
            BANK/COUPON OFFERS FOUND: "${extraOffers}"
            CURRENT TIME: "${currentIsoTime}"
            
            Task: Create a structured JSON output.
            1. catchyTitle: Clean, short, engaging title.
            2. category: Strictly pick ONE from this list: ${JSON.stringify(BROAD_CATEGORIES)}.
            3. price: Extract the final price. If none, return "".
            4. mrp: Extract the original MRP. If none, return "".
            5. discountPercent: Extract discount (e.g. "50%"). If none, return "".
            6. couponCode: ONLY extract ACTUAL alphanumeric promo codes (e.g., "FESTIVE50", "SAVE20"). DO NOT put sentences like "Apply 50% coupon" or "₹449 off with HDFC" here. If no exact alphanumeric code exists, return "".
            7. description: Write 2 short, engaging paragraphs. Then, add exactly "Why buy this?" followed by 3-4 bullet points using the features. IMPORTANT: If "BANK/COUPON OFFERS FOUND" or the telegram post has generic offers (like "Apply 33% Coupon" or "Bank CC offer"), DO NOT use them in couponCode. Instead, add them as the VERY LAST bullet point in bold (e.g., "**Don't forget to apply the 33% coupon / Bank offer at checkout!**").
            8. saleEndTime: If an expiry time/date is mentioned, calculate exact future date using CURRENT TIME. Return in ISO 8601 format. If no expiry, return null.
            
            Respond ONLY with a valid JSON object matching these 8 keys.
          `;

          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          const parsedAiData = JSON.parse(responseText);
          
          aiData.catchyTitle = parsedAiData.catchyTitle || ogTitle;
          aiData.category = BROAD_CATEGORIES.includes(parsedAiData.category) && parsedAiData.category !== "Other" ? parsedAiData.category : guessCategory(text + " " + ogTitle); 
          
          // 🛡️ THE DATA LOCK: Agar DDS se data aaya hai, toh AI ka data reject kar do
          aiData.price = isDDS && scraperPrice ? formatPrice(scraperPrice) : formatPrice(parsedAiData.price || scraperPrice);
          aiData.mrp = isDDS && finalMrp ? formatPrice(finalMrp) : formatPrice(parsedAiData.mrp || "");
          aiData.discountPercent = isDDS && scraperDiscount ? formatDiscount(scraperDiscount) : formatDiscount(parsedAiData.discountPercent || scraperDiscount);
          
          aiData.couponCode = parsedAiData.couponCode || "";
          aiData.description = parsedAiData.description || aiData.description;
          aiData.saleEndTime = parsedAiData.saleEndTime || null;
          
          console.log(`✅ AI Parsed Successfully using ${modelName}!`);
          aiSuccess = true;
          break; 
        } catch (aiError) {
          console.log(`⚠️ Model ${modelName} failed. Switching to next...`);
        }
    }

    if (!mongoose.connection.readyState) await mongoose.connect(process.env.MONGODB_URI);

    // 🚀 SAVE TO DB
    const newDeal = await GlobalDeal.create({
      creatorId: "telegram_bot",
      originalUrl: originalUrl, 
      expandedUrl: expandedUrl, 
      rawAffiliateLink: finalRawLink, 
      store: isDDS ? (hostname.includes("shopsy") ? "Shopsy" : (finalRawLink.includes("amazon") ? "Amazon" : (finalRawLink.includes("flipkart") ? "Flipkart" : "Other"))) : (scrapedData.store || "Unknown"), 
      title: aiData.catchyTitle,
      image: finalImage,
      category: aiData.category, 
      price: aiData.price, 
      mrp: aiData.mrp, 
      discountPercent: aiData.discountPercent,
      couponCode: aiData.couponCode,
      source: "telegram",
      description: aiData.description, 
      saleEndTime: aiData.saleEndTime 
    });

    console.log("✅ Auto Deal saved cleanly. Store:", newDeal.store);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("❌ Webhook/DB Critical Error:", error.message);
    return NextResponse.json({ error: "Caught internally", message: error.message }, { status: 200 }); 
  }
}