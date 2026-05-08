import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ success: false, message: "?url= parameter missing hai!" }, { status: 400 });
  }

  // Token check karna
  const token = process.env.SCRAPER_DO_TOKEN?.replace(/"/g, '').trim();

  if (!token) {
    return NextResponse.json({ 
      success: false, 
      message: "SCRAPER_DO_TOKEN .env file mein nahi mila! Dhyan se check karo." 
    }, { status: 500 });
  }

  try {
    console.log(`Testing Scrape.do for: ${targetUrl}`);
    
    // Scrape.do ka official endpoint
    const scrapeDoUrl = `http://api.scrape.do?token=${token}&url=${encodeURIComponent(targetUrl)}`;
    
    const response = await fetch(scrapeDoUrl);
    
    if (!response.ok) {
        return NextResponse.json({ 
            success: false, 
            message: `Scrape.do Failed with status: ${response.status}` 
        }, { status: response.status });
    }

    const html = await response.text();

    // HTML ke andar se basic check karna ki Flipkart ka data aaya ya Captcha aaya
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "Title Not Found";

    const isBlocked = html.includes("Access Denied") || html.includes("Robot Check");

    return NextResponse.json({
      success: true,
      testedUrl: targetUrl,
      isBlockedByStore: isBlocked,
      pageTitle: title,
      htmlLength: html.length,
      message: isBlocked ? "Scrape.do ko bhi Flipkart ne block kar diya!" : "Scrape.do ne Flipkart bypass kar liya! 🎉"
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Fetch Error", error: error.message }, { status: 500 });
  }
}