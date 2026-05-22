import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ⏱️ FAST TIMEOUT ENGINE 
async function fetchWithTimeout(resource, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// SIMPLIFIED EXPANDER (Only for testing)
async function expandUrl(shortUrl) {
  try {
    const res = await fetchWithTimeout(shortUrl, { method: 'GET', redirect: 'manual' }, 4000);
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      return loc ? expandUrl(loc) : shortUrl;
    }
    return res.url || shortUrl;
  } catch (e) {
    return shortUrl;
  }
}

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ success: false, error: "URL missing" });

    // Step 1: Expand URL
    const expandedUrl = await expandUrl(url);
    console.log("TESTING EXPANDED URL:", expandedUrl);

    let html = "";
    let methodUsed = "";

    // ==========================================
    // 🧪 TEST LAB AREA: Change variables to test different methods
    // ==========================================
    const USE_ALL_ORIGINS = true; 
    const USE_GOOGLE_CACHE = false; // Set to true to test Google Cache bypass
    
    // METHOD 1: All Origins Proxy
    if (USE_ALL_ORIGINS) {
      console.log("Trying AllOrigins...");
      try {
        const res = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(expandedUrl)}`, {}, 5000);
        const data = await res.json();
        if (data.contents && !data.contents.includes("access denied")) {
          html = data.contents;
          methodUsed = "AllOrigins Proxy";
        }
      } catch (e) { console.log("AllOrigins failed"); }
    }

    // METHOD 2: Google Cache Bypass (Very Powerful Free Trick)
    if (!html && USE_GOOGLE_CACHE) {
       console.log("Trying Google Web Cache...");
       try {
         const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(expandedUrl)}`;
         const res = await fetchWithTimeout(cacheUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 6000);
         const cacheHtml = await res.text();
         if (!cacheHtml.includes("404") && cacheHtml.length > 5000) {
            html = cacheHtml;
            methodUsed = "Google Cache Bypass";
         }
       } catch (e) { console.log("Google Cache failed"); }
    }

    // METHOD 3: Vercel Direct Fetch Fallback
    if (!html) {
      console.log("Trying Direct Fetch...");
      try {
        const res = await fetchWithTimeout(expandedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 5000);
        const directHtml = await res.text();
        if (!directHtml.includes("access denied")) {
           html = directHtml;
           methodUsed = "Vercel Direct";
        }
      } catch (e) {}
    }

    if (!html) return NextResponse.json({ success: false, error: "All methods blocked by Meesho" });

    // ==========================================
    // 🧠 DATA EXTRACTION ENGINE (Title, Image, ID)
    // ==========================================
    const $ = cheerio.load(html);
    
    let title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    let image = $('meta[property="og:image"]').attr('content') || '';
    let productId = "";

    // MEESHO PRODUCT ID EXTRACTION LOGIC
    // Logic 1: From URL
    const idMatchUrl = expandedUrl.match(/\/s\/p\/([^/?]+)/i) || expandedUrl.match(/[?&]product_id=(\d+)/i);
    if (idMatchUrl && idMatchUrl[1]) {
      productId = idMatchUrl[1];
    }
    
    // Logic 2: From Image URL (If image is https://images.meesho.com/images/products/123456/original_1.jpg)
    if (!productId && image) {
      const imgIdMatch = image.match(/\/products\/(\d+)\//i);
      if (imgIdMatch && imgIdMatch[1]) productId = imgIdMatch[1];
    }

    // Logic 3: From JSON-LD / __NEXT_DATA__
    if (!productId || !title) {
       const nextData = $('#__NEXT_DATA__').html();
       if (nextData) {
         try {
           const jsonData = JSON.parse(nextData);
           // Try to dig into Meesho's specific JSON structure (This changes often, requires trial & error)
           // You can log `jsonData` here to inspect it in your terminal
         } catch(e) {}
       }
    }

    // Cleaning title
    title = title.replace(/\|?\s*Meesho\s*/i, '').replace(/Buy online.*/i, '').trim();

    return NextResponse.json({ 
      success: true, 
      method: methodUsed,
      data: {
        originalUrl: url,
        expandedUrl,
        title: title || "Title Not Found",
        image: image || "Image Not Found",
        productId: productId || "ID Not Found"
      }
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}