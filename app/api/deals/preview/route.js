import { NextResponse } from "next/server";
import { getOgTags } from "@/lib/scraper";

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ success: false, message: "URL dena zaroori hai!" }, { status: 400 });
    }

    console.log(`🔍 Preview Fetching for: ${url}`);
    
    // Scraper ko bulana
    const scrapedData = await getOgTags(url);

    if (!scrapedData.success) {
      return NextResponse.json({ success: false, message: "Link scrape nahi ho paya." }, { status: 500 });
    }

    // Sirf data wapas bhejna, DB mein save nahi karna
    return NextResponse.json({ 
      success: true, 
      data: scrapedData 
    }, { status: 200 });

  } catch (error) {
    console.error("⛔ Preview API Error:", error.message);
    return NextResponse.json({ success: false, message: "Server error!" }, { status: 500 });
  }
}