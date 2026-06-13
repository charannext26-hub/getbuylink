import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import { getOgTags } from "@/lib/scraper";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 🚨 VERCEL TIMEOUT FIX
export const maxDuration = 60; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const BROAD_CATEGORIES = [
  "Men's Fashion",
  "Women's Fashion", 
  "Electronics & Mobiles", 
  "Beauty & Grooming", 
  "Home & Kitchen", 
  "Footwear", 
  "Accessories", 
  "Grocery",
  "Kids Product",
  "Special Deals"
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

export async function POST(req) {
  try {
    const body = await req.json();
    
    let text = "";
    const msg = body.message || body.channel_post || body.edited_message || body.edited_channel_post;
    
    if (msg) {
      text = msg.text || msg.caption || "";
    }

    if (!text) {
      return NextResponse.json({ status: "ignored", reason: "No text found" }, { status: 200 });
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);

    if (!urls || urls.length === 0) {
      return NextResponse.json({ status: "no_url" }, { status: 200 });
    }

    const targetUrl = urls[0];

    // THE MASTER SCRAPER LAYER
    const scrapedData = await getOgTags(targetUrl);
    const ogTitle = (scrapedData.success && scrapedData.title) ? scrapedData.title : "Exclusive Deal";
    
    const fallbackImage = "https://placehold.co/600x400/indigo/white?text=Mega+Deal";
    const finalImage = (scrapedData.success && scrapedData.image) ? scrapedData.image : fallbackImage;

    const finalExpandedUrl = (scrapedData.success && scrapedData.expandedUrl) ? scrapedData.expandedUrl : targetUrl;
    const finalStoreName = (scrapedData.success && scrapedData.store) ? scrapedData.store : "Unknown";

    const scraperPrice = (scrapedData.success && scrapedData.price) ? scrapedData.price : "";
    const scraperDiscount = (scrapedData.success && scrapedData.discountPercent) ? scrapedData.discountPercent : "";

    let aiData = {
      catchyTitle: ogTitle,
      category: guessCategory(text + " " + ogTitle), 
      price: formatPrice(scraperPrice), 
      discountPercent: formatDiscount(scraperDiscount), 
      couponCode: "",
      description: "An amazing handpicked deal. Click to grab it before the offer ends!",
      saleEndTime: null
    };

    // 🤖 THE MULTI-MODEL AI BRAIN
    const AI_MODELS = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-flash"];
    let aiSuccess = false;

    for (const modelName of AI_MODELS) {
        try {
          console.log(`➡️ Trying AI Model: ${modelName}`);
          const model = genAI.getGenerativeModel({ 
              model: modelName,
              generationConfig: { responseMimeType: "application/json" }
          }); 

          // 🔥 NAYA: Current Time pass kar rahe hain taaki AI exact expiry date nikal sake
          const currentIsoTime = new Date().toISOString();

          const prompt = `
            Analyze this e-commerce deal carefully.
            TELEGRAM POST: "${text}"
            SCRAPED TITLE: "${ogTitle}"
            CURRENT TIME: "${currentIsoTime}"
            
            1. catchyTitle: Clean, short title. No emojis.
            2. category: Strictly pick ONE from this list: ${JSON.stringify(BROAD_CATEGORIES)}.
            3. price: Extract ONLY the final price number from text. If none, return "".
            4. discountPercent: Extract discount (e.g. "50% OFF") from text. If none, return "".
            5. couponCode: Extract promo code from text. If none, return "".
            6. description: Act like a friendly creator recommending a product to their close audience. Write 2 to 3 short, engaging paragraphs to avoid boredom. Then, add the exact phrase "Why buy this?" followed by 3 to 4 bullet points. IMPORTANT: If the telegram post mentions a coupon (e.g., "Apply 50% coupon"), make the final bullet point bold reminding them to use it at checkout (e.g., "**Don't forget to apply the 50% coupon on the store!**").
            7. saleEndTime: If an expiry time, date, or duration (e.g., "ends in 4 hours", "valid till tonight") is mentioned, calculate the exact future expiry date using the CURRENT TIME provided. Return it STRICTLY in standard ISO 8601 format (e.g., "2026-06-15T12:00:00.000Z"). If no expiry is mentioned, return null.
            
            Respond ONLY with a valid JSON object matching these 7 keys.
          `;

          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          
          const parsedAiData = JSON.parse(responseText);
          
          aiData.catchyTitle = parsedAiData.catchyTitle || ogTitle;
          
          if (BROAD_CATEGORIES.includes(parsedAiData.category) && parsedAiData.category !== "Other") {
              aiData.category = parsedAiData.category;
          } else {
              aiData.category = guessCategory(text + " " + ogTitle); 
          }
          
          aiData.price = formatPrice(parsedAiData.price) || formatPrice(scraperPrice) || "";
          aiData.discountPercent = formatDiscount(parsedAiData.discountPercent) || formatDiscount(scraperDiscount) || "";
          aiData.couponCode = parsedAiData.couponCode || "";
          
          // 🔥 NAYA: Capturing the generated description and expiry time
          aiData.description = parsedAiData.description || aiData.description;
          aiData.saleEndTime = parsedAiData.saleEndTime || null;
          
          console.log(`✅ AI Parsed Successfully using ${modelName}!`);
          aiSuccess = true;
          break; 

        } catch (aiError) {
          console.log(`⚠️ Model ${modelName} failed/Limit Reached. Switching to next...`);
        }
    }

    if (!aiSuccess) {
        console.error("❌ All AI Models Failed. Using Scraper Fallback Data.");
    }

    // DATABASE CONNECTION FIX
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // SAVE TO DB
    const newDeal = await GlobalDeal.create({
      creatorId: "telegram_bot",
      originalUrl: targetUrl,
      expandedUrl: finalExpandedUrl, 
      store: finalStoreName, 
      title: aiData.catchyTitle,
      image: finalImage,
      category: aiData.category, 
      price: aiData.price, 
      discountPercent: aiData.discountPercent,
      couponCode: aiData.couponCode,
      source: "telegram",
      description: aiData.description, // 🔥 Saved to DB
      saleEndTime: aiData.saleEndTime // 🔥 Saved to DB
    });

    console.log("✅ Auto Deal saved cleanly. Category:", newDeal.category);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("❌ Webhook/DB Critical Error:", error.message);
    return NextResponse.json({ error: "Caught internally", message: error.message }, { status: 200 }); 
  }
}