import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ success: false, error: "URL missing" });

    console.log("🔍 Original Link:", url);

    // STEP 1: Link se Product ID nikalna (The Regex Magic)
    // Ye formula /p/ ke baad wale alphanumeric code ko pakad lega (jaise 'bu02i3')
    let productId = null;
    const match = url.match(/\/p\/([a-zA-Z0-9]+)/i);
    
    if (match && match[1]) {
      productId = match[1];
      console.log("✅ Product ID Extracted:", productId);
    } else {
      return NextResponse.json({ success: false, error: "Link format invalid, ID nahi mili." });
    }

    // STEP 2: Mobile App Spoofing (Bypass WAF)
    // Hum WAF ko bypass karne ke liye Mobile browser aur Meesho App wale headers bhejenge
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
    };

    // Hum clean product URL banayenge ID use karke
    const cleanProductUrl = `https://www.meesho.com/s/p/${productId}`;
    
    console.log("🚀 Fetching Data from:", cleanProductUrl);
    
    const response = await fetch(cleanProductUrl, {
      method: 'GET',
      headers: headers
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // STEP 3: Data Extract Karna
    let title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    let image = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '';

    // Title ko clean karna
    title = title.replace(/\|?\s*Meesho\s*/i, '').replace(/Buy online.*/i, '').trim();

    // Agar WAF block karta hai toh Title mein "Access Denied" ya "Security" aayega
    if (title.toLowerCase().includes("just a moment") || title.toLowerCase().includes("access denied")) {
        // Agar HTML fail ho jaye, toh hum JSON API fallback try karenge
        return NextResponse.json({ 
            success: false, 
            error: "WAF ne HTML block kar diya.", 
            productId: productId,
            note: "Humein direct JSON API endpoint dhoondhna padega."
        });
    }

    if (!title || !image) {
        return NextResponse.json({ 
            success: false, 
            error: "Page load hua par Title/Image nahi mila.", 
            productId: productId 
        });
    }

    return NextResponse.json({ 
      success: true, 
      method: "ID Extractor + Mobile Spoof",
      data: {
        originalUrl: url,
        productId: productId,
        title: title,
        image: image
      }
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}