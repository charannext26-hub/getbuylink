import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function POST(req) {
  let browser = null;
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ success: false, error: "URL missing" });

    console.log("🚀 Starting Headless Browser for:", url);

    // Vercel aur Localhost dono ke liye Chromium setup
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // WAF ko bypass karne ke liye real User-Agent set karna
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    // Link open karein aur page load hone ka wait karein
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    // Evaluate function browser ke andar chalta hai aur real DOM se data nikalta hai
    const extractedData = await page.evaluate(() => {
      let title = document.querySelector('meta[property="og:title"]')?.content || document.title || '';
      let image = document.querySelector('meta[property="og:image"]')?.content || document.querySelector('meta[name="twitter:image"]')?.content || '';
      
      // Agar og tags na mile toh page ke andar se image dhoondhne ka try karein
      if (!image) {
        const imgTag = document.querySelector('img[src*="images.meesho.com/images/products"]');
        if (imgTag) image = imgTag.src;
      }

      title = title.replace(/\|?\s*Meesho\s*/i, '').replace(/Buy online.*/i, '').trim();

      return { title, image };
    });

    if (!extractedData.title || !extractedData.image) {
       return NextResponse.json({ success: false, error: "Page loaded but Title/Image not found (Possible WAF Block)" });
    }

    // Product ID extract karne ka logic (Same as before)
    let productId = "";
    if (extractedData.image) {
      const imgIdMatch = extractedData.image.match(/\/products\/(\d+)\//i);
      if (imgIdMatch && imgIdMatch[1]) productId = imgIdMatch[1];
    }
    if (!productId) {
      const idMatchUrl = page.url().match(/\/s\/p\/([^/?]+)/i) || page.url().match(/[?&]product_id=([^&]+)/i);
      if (idMatchUrl && idMatchUrl[1]) productId = idMatchUrl[1];
    }

    return NextResponse.json({ 
      success: true, 
      method: "Puppeteer Stealth (Vercel)",
      data: {
        originalUrl: url,
        finalUrl: page.url(),
        title: extractedData.title,
        image: extractedData.image,
        productId: productId || "ID Not Found"
      }
    });

  } catch (error) {
    console.error("Scraping Error:", error);
    return NextResponse.json({ success: false, error: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}