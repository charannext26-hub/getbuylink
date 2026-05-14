import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ success: false, message: "?url= parameter missing hai!" }, { status: 400 });
  }

  const token = process.env.SCRAPER_DO_TOKEN?.replace(/"/g, '').trim();

  if (!token) {
    return NextResponse.json({ success: false, message: "SCRAPER_DO_TOKEN nahi mila!" }, { status: 500 });
  }

  try {
    console.log(`🔍 Testing Deep Scrape.do for: ${targetUrl}`);
    
    const scrapeDoUrl = `http://api.scrape.do?token=${token}&url=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(scrapeDoUrl);
    
    if (!response.ok) {
        return NextResponse.json({ success: false, message: `Scrape.do Failed: ${response.status}` }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // ==========================================
    // 🧠 THE X-RAY EXTRACTION
    // ==========================================
    
    // 1. Basic Meta Data
    const title = $('title').text().trim();
    const ogTitle = $('meta[property="og:title"]').attr('content') || "";
    let image = $('meta[property="og:image"]').attr('content') || "";
    
    // Flipkart specific HD Image Fix
    const fkImgMatch = html.match(/(https:\/\/rukminim2\.flixcart\.com\/image\/[^"'\s\\]+)/i);
    if (fkImgMatch && fkImgMatch[1]) {
        image = fkImgMatch[1].replace(/{@width}|{@height}/g, '416');
    }

    // 2. Aggressive Price Extraction (Find ₹)
    let price = $('div[class*="Nx9"], div[class*="jeq"]').first().text().trim();
    if (!price || !price.includes('₹')) {
        price = $('div:contains("₹")').filter((i, el) => $(el).text().trim().match(/^₹[0-9,]+$/)).first().text().trim() || "Not Found";
    }

    // 3. Aggressive Discount Extraction (Find % off)
    let discount = $('div[class*="Ay6"], div[class*="UkU"]').first().text().trim();
    if (!discount || !discount.includes('% off')) {
        const discountMatch = html.match(/(\d+% off)/i);
        discount = discountMatch ? discountMatch[1] : "Not Found";
    }

    // 4. Extract Hidden JSON-LD (Here Flipkart hides Brand, Category, Rating etc)
    let jsonLdData = [];
    $('script[type="application/ld+json"]').each((i, el) => {
        try {
            jsonLdData.push(JSON.parse($(el).html()));
        } catch (e) { }
    });

    // 5. Smart Block Detection
    let isBlocked = false;
    // Agar HTML chota hai aur block words hain, tabhi block mano. 1MB+ HTML kabhi block nahi hota!
    if (html.length < 50000 && (html.toLowerCase().includes("access denied") || html.toLowerCase().includes("robot check"))) {
        isBlocked = true;
    }

    return NextResponse.json({
      success: true,
      testedUrl: targetUrl,
      diagnostics: {
          htmlLength: html.length,
          isActuallyBlocked: isBlocked,
          message: isBlocked ? "❌ Blocked!" : "✅ Full Page Scraped Successfully!"
      },
      extractedData: {
          cleanTitle: title.replace(/Buy .*?Online at Best Prices.*/i, '').trim(),
          rawTitle: title,
          ogTitle: ogTitle,
          imageUrl: image,
          foundPrice: price,
          foundDiscount: discount
      },
      hiddenSchemaData: jsonLdData // Ye array aapko dikhayega Flipkart ne kya kya chupa rakha hai
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Fetch Error", error: error.message }, { status: 500 });
  }
}