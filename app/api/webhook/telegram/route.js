import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";
import { getOgTags } from "@/lib/scraper";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// category select
const BROAD_CATEGORIES = [
  "Men's Fashion",
  "Women's Fashion", 
  "Electronics & Mobiles", 
  "Beauty & Grooming", 
  "Home & Kitchen", 
  "Footwear", 
  "Accessories", 
  "Grocery"
];

export async function POST(req) {
  try {
    const body = await req.json();
    
    // 1. ULTIMATE TEXT EXTRACTOR
    let text = "";
    const msg = body.message || body.channel_post || body.edited_message || body.edited_channel_post;
    
    if (msg) {
      text = msg.text || msg.caption || "";
    }

    if (!text) {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);

    if (!urls || urls.length === 0) {
      return NextResponse.json({ status: "no_url" }, { status: 200 });
    }

    // SIRF PEHLA LINK LEGA
    const targetUrl = urls[0];

    // 2. SCRAPER (Yahan se lamba link aayega)
    const scrapedData = await getOgTags(targetUrl);
    const ogTitle = (scrapedData.success && scrapedData.title) ? scrapedData.title : "Exclusive Deal";
    
    const fallbackImage = "https://placehold.co/600x400/indigo/white?text=Mega+Deal";
    const finalImage = (scrapedData.success && scrapedData.image) ? scrapedData.image : fallbackImage;

    // 🚨 MASTERSTROKE: Lamba link aur Store Name nikalna
    const finalExpandedUrl = (scrapedData.success && scrapedData.expandedUrl) ? scrapedData.expandedUrl : targetUrl;
    const finalStoreName = (scrapedData.success && scrapedData.store) ? scrapedData.store : "Unknown";

    // 3. THE FALLBACK SHIELD (Agar AI fail ho jaye toh API/Scraper ka data use karo)
    let aiData = {
      catchyTitle: ogTitle,
      category: (scrapedData.success && scrapedData.category) ? scrapedData.category : "Other",
      price: (scrapedData.success && scrapedData.price) ? scrapedData.price : "Best Price",
      discountPercent: (scrapedData.success && scrapedData.discountPercent) ? scrapedData.discountPercent : "",
      couponCode: ""
    };

    // 4. THE AI BRAIN
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }); 
      const prompt = `
        You are an expert Indian e-commerce affiliate copywriter.
        DATA SOURCE 1: "${text}"
        DATA SOURCE 2: "${ogTitle}"
        
        Tasks:
        1. Catchy Title: Short, attractive title.
        2. Category: Choose ONLY from: ${JSON.stringify(BROAD_CATEGORIES)}. If it doesn't fit perfectly, use "Other".
        3. Price: Exact final price from DATA SOURCE 1 or 'Best Price'.
        4. Discount: Discount from DATA SOURCE 1 or ''.
        5. Coupon: Coupon code from DATA SOURCE 1 or ''.
        
        Respond ONLY in exact JSON format:
        {"catchyTitle": "...", "category": "...", "price": "...", "discountPercent": "...", "couponCode": "..."}
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      aiData = JSON.parse(responseText);
      console.log("🔥 AI Ne Successfully Data Nikala!");

    } catch (aiError) {
      console.error("⚠️ Gemini Limit Exceeded ya Error, Fallback data use kar rahe hain...");
    }

    // 5. DATABASE SAVE
    await mongoose.connect(process.env.MONGODB_URI);

    const newDeal = await GlobalDeal.create({
      creatorId: "telegram_bot",
      originalUrl: targetUrl,
      expandedUrl: finalExpandedUrl, // 🚨 Cuelinks Tab 3 conversion ke liye ekdum ready
      store: finalStoreName,         // 🚨 Tracking report ke liye zaroori
      title: aiData.catchyTitle,
      image: finalImage,
      category: aiData.category,
      price: aiData.price,
      discountPercent: aiData.discountPercent,
      couponCode: aiData.couponCode,
      source: "telegram",
    });

    console.log("✅ Deal Database mein save ho gayi:", newDeal.title);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Webhook Internal Error:", error);
    return NextResponse.json({ error: "Caught internally" }, { status: 200 });
  }
}