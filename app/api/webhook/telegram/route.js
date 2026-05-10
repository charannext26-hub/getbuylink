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
  "Special Deals"
];

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
      price: scraperPrice, 
      discountPercent: scraperDiscount,
      couponCode: ""
    };

    // 🤖 THE PRO AI BRAIN (Force JSON Mode)
    try {
      // Use gemini-1.5-flash as it natively supports strict JSON output
      const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          generationConfig: { responseMimeType: "application/json" } // 🔥 FORCE 100% JSON
      }); 

      const prompt = `
        Analyze this e-commerce deal.
        TELEGRAM POST: "${text}"
        SCRAPED TITLE: "${ogTitle}"
        
        1. catchyTitle: Clean, short title. No emojis.
        2. category: Strictly pick ONE from this list: ${JSON.stringify(BROAD_CATEGORIES)}.
        3. price: Extract price from text. If none, return "". DO NOT invent.
        4. discountPercent: Extract discount (e.g. "50% OFF") from text. If none, return "".
        5. couponCode: Extract promo code from text. If none, return "".
        
        Respond ONLY with a valid JSON object.
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
      
      aiData.price = parsedAiData.price || scraperPrice || "";
      aiData.discountPercent = parsedAiData.discountPercent || scraperDiscount || "";
      aiData.couponCode = parsedAiData.couponCode || "";
      
      console.log("✅ AI Parsed Successfully!");

    } catch (aiError) {
      console.error("⚠️ AI / Rate Limit Failed. Using Safe Fallback Data. Reason:", aiError.message);
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
    });

    console.log("✅ Auto Deal saved cleanly with category:", newDeal.category);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    // 🔥 ASLI DATABASE ERROR YAHAN DIKHEGA
    console.error("❌ Webhook/DB Critical Error:", error.message);
    return NextResponse.json({ error: "Caught internally", message: error.message }, { status: 200 }); 
  }
}