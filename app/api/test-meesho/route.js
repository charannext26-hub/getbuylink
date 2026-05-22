import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ⏱️ FAST TIMEOUT ENGINE (Bina iske Vercel crash ho jayega)
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

// SIMPLIFIED EXPANDER
async function expandUrl(shortUrl) {
  try {
    const res = await fetchWithTimeout(shortUrl, { 
      method: 'GET', 
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, 5000);
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      return loc ? expandUrl(loc) : shortUrl;
    }
    return res.url || shortUrl;
  } catch (e) {
    return shortUrl;
  }
}

// 🛡️ CHECK IF PAGE IS BLOCKED
function isBlocked(htmlText) {
  if (!htmlText) return true;
  const t = htmlText.toLowerCase();
  return t.includes("access denied") || t.includes("robot check") || t.includes("are you a human") || t.includes("just a moment");
}

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ success: false, error: "URL missing" });

    // Step 1: Link Expand (Short to Long)
    const expandedUrl = await expandUrl(url);
    console.log("TESTING EXPANDED URL:", expandedUrl);

    let html = "";
    let methodUsed = "";

    // ==========================================
    // 🧪 4-STAGE SERVER BYPASS ENGINE
    // ==========================================

    // METHOD 1: Googlebot Spoofing (Datacenter IP hone ke bawajood bots allow hote hain)
    console.log("▶️ Trying Method 1: Googlebot Spoofing...");
    try {
      const res1 = await fetchWithTimeout(expandedUrl, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml',
        } 
      }, 5000);
      const html1 = await res1.text();
      if (!isBlocked(html1)) {
         html = html1;
         methodUsed = "Googlebot Spoofing";
      }
    } catch (e) {}

    // METHOD 2: AllOrigins RAW (Open Free Proxy)
    if (!html) {
      console.log("▶️ Trying Method 2: AllOrigins RAW...");
      try {
        // .win/raw returns raw HTML directly instead of JSON
        const res2 = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(expandedUrl)}`, {}, 6000);
        const html2 = await res2.text();
        if (!isBlocked(html2)) {
          html = html2;
          methodUsed = "AllOrigins RAW Proxy";
        }
      } catch (e) {}
    }

    // METHOD 3: CorsProxy.io (Powerful Datacenter Masking)
    if (!html) {
      console.log("▶️ Trying Method 3: CorsProxy.io...");
      try {
        const res3 = await fetchWithTimeout(`https://corsproxy.io/?${encodeURIComponent(expandedUrl)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        }, 6000);
        const html3 = await res3.text();
        if (!isBlocked(html3)) {
          html = html3;
          methodUsed = "CorsProxy.io Bypass";
        }
      } catch (e) {}
    }

    // METHOD 4: Google Web Cache (Ultimate Fallback - Gets data from Google's DB)
    if (!html) {
       console.log("▶️ Trying Method 4: Google Web Cache...");
       try {
         const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(expandedUrl)}`;
         const res4 = await fetchWithTimeout(cacheUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 6000);
         const html4 = await res4.text();
         if (!html4.includes("404") && !isBlocked(html4)) {
            html = html4;
            methodUsed = "Google Cache Extraction";
         }
       } catch (e) {}
    }

    // FAILSAFE
    if (!html) {
      return NextResponse.json({ success: false, error: "All 4 Bypasses Blocked by Meesho WAF (Cloudflare/Akamai)." });
    }

    // ==========================================
    // 🧠 DATA EXTRACTION ENGINE (Title, Image, ID)
    // ==========================================
    const $ = cheerio.load(html);
    
    let title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    let image = $('meta[property="og:image"]').attr('content') || '';
    let productId = "";

    // 🎯 LOGIC 1: URL se Product ID nikalna (e.g. /s/p/89z7xn)
    const idMatchUrl = expandedUrl.match(/\/s\/p\/([^/?]+)/i) || expandedUrl.match(/[?&]product_id=([^&]+)/i);
    if (idMatchUrl && idMatchUrl[1]) {
      productId = idMatchUrl[1];
    }
    
    // 🎯 LOGIC 2: Agar URL mein nahi mila toh Image Link se try karna
    if (!productId && image) {
      const imgIdMatch = image.match(/\/products\/([^/]+)\//i);
      if (imgIdMatch && imgIdMatch[1]) productId = imgIdMatch[1];
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