import { NextResponse } from "next/server";
import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";

export const maxDuration = 60; 

export async function POST(req) {
  try {
    const body = await req.json();
    const targetUrl = body.url;

    if (!targetUrl) return NextResponse.json({ status: "ignored", reason: "No URL found" }, { status: 400 });

    // 1. DATABASE CONNECTION
    if (!mongoose.connection.readyState) await mongoose.connect(process.env.MONGODB_URI);

    // 2. 🚨 THE DUPLICATE CHECKER (Paisa aur Server Bachane wala filter)
    const existingDeal = await GlobalDeal.findOne({ originalUrl: targetUrl });
    if (existingDeal) {
        console.log(`⏩ Deal Already Exists. Skipping: ${targetUrl}`);
        return NextResponse.json({ status: "already_exists", url: targetUrl }, { status: 200 });
    }

    console.log(`🔥 New Deal Found! Processing: ${targetUrl}`);

    // 3. CALL YOUR DDS SCRAPER
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
        console.error("DDS fetch error:", e.message);
        return NextResponse.json({ status: "scraper_failed" }, { status: 500 });
    }

    // 4. DATA PREPARATION (If DDS got the data)
    if (!scrapedData.title) {
         return NextResponse.json({ status: "no_data_scraped" }, { status: 400 });
    }

    // Yahan hum pehle bina AI ke raw data set kar rahe hain
    // (Aap chaho toh yahan apna Gemini AI ka logic copy-paste kar sakte ho Telegram webhook se)
    
    const finalRawLink = scrapedData.bestRawLink && scrapedData.bestRawLink !== "Link still hidden." ? scrapedData.bestRawLink : targetUrl;
    
    // 5. SAVE TO DATABASE
    const newDeal = await GlobalDeal.create({
      creatorId: "auto_bot",
      originalUrl: targetUrl, 
      expandedUrl: targetUrl, 
      rawAffiliateLink: finalRawLink, 
      store: targetUrl.includes("dealsmagnet") ? "DealsMagnet" : "DealsSpy", 
      title: scrapedData.title,
      image: scrapedData.image,
      category: "Special Deals", // AI lagane ke baad isko update kar dena
      price: scrapedData.offerPrice ? `₹${scrapedData.offerPrice}` : "", 
      mrp: scrapedData.mrp ? `₹${scrapedData.mrp}` : "", 
      discountPercent: scrapedData.discountPercentage ? `${scrapedData.discountPercentage}% OFF` : "",
      source: "auto_scraper",
      description: scrapedData.description ? scrapedData.description.join(" ") : "Best deal found online!", 
    });

    console.log("✅ Auto Deal Saved!");
    return NextResponse.json({ status: "success", dealId: newDeal._id }, { status: 200 });

  } catch (error) {
    console.error("❌ Auto-Fetcher Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 }); 
  }
}