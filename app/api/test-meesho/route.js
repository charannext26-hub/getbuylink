import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ success: false, error: "URL missing" });

    // STEP 1: Product ID Extract karna (Ye perfectly kaam kar raha hai)
    let productId = null;
    const match = url.match(/\/p\/([a-zA-Z0-9]+)/i);
    
    if (match && match[1]) {
      productId = match[1];
    } else {
      // Agar direct bu02i3 jaisa link ho
      const parts = url.split('/');
      productId = parts[parts.length - 1].split('?')[0]; 
    }

    const cleanProductUrl = `https://www.meesho.com/s/p/${productId}`;
    console.log("🧼 Target URL:", cleanProductUrl);

    // STEP 2: The Magic Headers (WhatsApp Spoofing)
    // Ye headers Cloudflare WAF ko VIP pass dene par majboor kar dete hain
    const headers = {
      'User-Agent': 'WhatsApp/2.22.16.75 A', // WAF isko block nahi karta
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive'
    };

    console.log("🚀 Hitting with WhatsApp Bot Identity...");

    const response = await fetch(cleanProductUrl, {
      method: 'GET',
      headers: headers
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // STEP 3: Sirf Meta Tags nikalna (Jo WhatsApp ko chahiye hote hain)
    let title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    let image = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '';

    // Check for WAF Block
    const tLower = title.toLowerCase();
    if (tLower.includes("just a moment") || tLower.includes("access denied") || tLower.includes("security")) {
      return NextResponse.json({ 
        success: false, 
        error: "WhatsApp Spoofing ko bhi WAF ne pakad liya.",
        debugHTML: title // Check karne ke liye ki WAF ne kya bheja
      });
    }

    // Title Cleaning
    title = title.replace(/\|?\s*Meesho\s*/i, '').replace(/Buy online.*/i, '').trim();

    if (!title || !image) {
      return NextResponse.json({ success: false, error: "Bypass ho gaya, par Image/Title data nahi mila." });
    }

    // SUCCESS
    return NextResponse.json({ 
      success: true, 
      method: "Social Crawler (WhatsApp) Bypass",
      data: {
        originalUrl: url,
        cleanUrl: cleanProductUrl,
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