import * as cheerio from "cheerio";
import { fetchAmazonProductData } from "./amazonEngine";

export function extractASIN(url) {
  const asinMatch = url.match(/\/(?:dp|gp\/product|exec\/obidos\/ASIN|o)\/([A-Z0-9]{10})/i);
  return asinMatch ? asinMatch[1] : null;
}

// 🚀 NAYA: SMART PROXY FETCHER (Vercel IP Block Bypass)
async function fetchHtmlWithProxy(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s max

  try {
    // Pehle normal fetch try karenge (Fastest)
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    // Agar block ho gaya (403/503), toh throw error taaki proxy chale
    if (res.status === 403 || res.status === 503) throw new Error("Blocked by Store");
    
    return await res.text();
  } catch (error) {
    // 🚨 PROXY FALLBACK: Agar Vercel block hua, toh hum AllOrigins Proxy use karenge
    console.log(`⚠️ Vercel Blocked for ${url}. Using Global Proxy Bypass...`);
    try {
      const proxyRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const proxyData = await proxyRes.json();
      if (proxyData && proxyData.contents) {
        return proxyData.contents; // Proxy ne HTML la kar de diya!
      }
    } catch (proxyErr) {
      console.log("Proxy also failed.");
    }
    return null;
  }
}

// 1. THE DEEP EXPANDER MACHINE
export async function expandUrl(shortUrl, depth = 0) {
  if (depth > 3) return shortUrl; 

  try {
    console.log(`Deep Expand Level ${depth}:`, shortUrl);

    if ((shortUrl.includes('amazon.') || shortUrl.includes('amzn.')) && extractASIN(shortUrl)) {
        return shortUrl; 
    }

    if (shortUrl.includes('lehlah.club')) {
      const parts = shortUrl.split('/');
      const shortCode = parts[parts.length - 1]; 
      const lehlahApi = "https://app.lehlah.club/api/generate-redirect-url-in-app-redirection";
      const response = await fetch(lehlahApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "short_code": shortCode, "is_telegram": true })
      });
      const lehlahData = await response.json();
      if (lehlahData && lehlahData.redirect_url) return expandUrl(lehlahData.redirect_url, depth + 1);
    }

    const isManualRedirect = shortUrl.includes('meesho.com/b') || shortUrl.includes('amzn.to') || shortUrl.includes('amzn.in/') || shortUrl.includes('fkrt.it');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    let response;
    try {
      response = await fetch(shortUrl, {
        method: 'GET',
        redirect: isManualRedirect ? 'manual' : 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      throw fetchErr;
    }

    if (response.status === 403 || response.status === 503 || response.status === 400) {
      try {
        const apiRes = await fetch(`https://unshorten.me/json/${encodeURIComponent(shortUrl)}`);
        const apiData = await apiRes.json();
        if (apiData && apiData.resolved_url) return expandUrl(apiData.resolved_url, depth + 1);
      } catch (e) { }
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location && !location.includes('play.google.com')) {
          const nextUrl = location.startsWith('http') ? location : new URL(location, shortUrl).href;
          return expandUrl(nextUrl, depth + 1);
      } else return shortUrl; 
    }

    let currentUrl = response.url;
    
    if (currentUrl.includes('wishlink.') || currentUrl.includes('cutt.ly') || currentUrl.includes('ltl.sh')) {
      const html = await response.text();
      const redirectJsonMatch = html.match(/"(?:productUrl|redirectUrl|url)"\s*:\s*"([^"]+)"/i);
      if (redirectJsonMatch && redirectJsonMatch[1]) {
          const cleanJsonUrl = redirectJsonMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
          return expandUrl(cleanJsonUrl, depth + 1);
      }
      const metaRefreshMatch = html.match(/url=(https?:\/\/[^"'>]+)/i);
      if (metaRefreshMatch && metaRefreshMatch[1]) return expandUrl(metaRefreshMatch[1], depth + 1);
      const hiddenEcomLink = html.match(/(https?:\/\/(?:www\.)?(?:flipkart\.com|dl\.flipkart\.com|amazon\.in|myntra\.com|ajio\.com|meesho\.com)[^"'\s\\]+)/i);
      if (hiddenEcomLink && hiddenEcomLink[1]) return expandUrl(hiddenEcomLink[1], depth + 1); 
    }

    return currentUrl;
  } catch (error) {
    try {
        if(shortUrl.includes('amzn.') || shortUrl.includes('fkrt.it')) {
            const apiRes = await fetch(`https://unshorten.me/json/${encodeURIComponent(shortUrl)}`);
            const apiData = await apiRes.json();
            if (apiData && apiData.resolved_url) return apiData.resolved_url;
        }
    } catch(e) {}
    return shortUrl; 
  }
}

// 2. STORE NAME DETECTOR
export function getStoreName(url) {
  if (url.includes('amazon.') || url.includes('amzn.')) return 'Amazon';
  if (url.includes('flipkart.com') || url.includes('fktr.in') || url.includes('dl.flipkart.com') || url.includes('fkrt.it')) return 'Flipkart';
  if (url.includes('myntra.com')) return 'Myntra';
  if (url.includes('meesho.com') || url.includes('ltl.sh')) return 'Meesho';
  if (url.includes('ajio.com')) return 'Ajio';
  if (url.includes('nykaa.com')) return 'Nykaa';
  if (url.includes('tataCLiQ.com')) return 'Tata CLiQ';
  
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  } catch (e) {
    return 'Other Store';
  }
}

// 3. THE MASTER SCRAPER ENGINE
export async function getOgTags(targetUrl) {
  try {
    let fallbackTitle = "";
    let fallbackImage = "";

    // --- STEP A: PRE-SCRAPE (Wishlink Backup) ---
    try {
        const fbResponse = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
        const fbHtml = await fbResponse.text();
        const $fb = cheerio.load(fbHtml);
        fallbackTitle = $fb('meta[property="og:title"]').attr('content') || $fb('title').text() || '';
        fallbackImage = $fb('meta[property="og:image"]').attr('content') || '';
        fallbackTitle = fallbackTitle.replace(/\|?\s*Lehlah\s*/i, '').replace(/Buy online.*/i, '').replace(/on Wishlink/i, '').trim();
    } catch (e) {}

    // --- STEP B: LINK EXPANSION ---
    const finalUrl = await expandUrl(targetUrl);
    console.log("✅ Final Expanded URL:", finalUrl);
    const storeName = getStoreName(finalUrl);

    let title = '';
    let image = '';

    // --- STORE 1: AMAZON ---
    if (storeName === 'Amazon') {
      const asin = extractASIN(finalUrl);
      if (asin) {
        const amazonData = await fetchAmazonProductData(asin, finalUrl);
        return {
          success: amazonData.success, originalUrl: targetUrl, expandedUrl: finalUrl, store: storeName,
          title: amazonData.title || "Amazon Exclusive Deal", description: "", image: amazonData.image || "", 
          price: amazonData.price || "Best Price", discountPercent: amazonData.discountPercent || ""
        };
      }
    }

    // --- STORE 2: MEESHO ---
    if (storeName === 'Meesho') {
        if (fallbackImage && fallbackImage.includes('http')) {
            return { success: true, originalUrl: targetUrl, expandedUrl: finalUrl, title: fallbackTitle || "Meesho Exclusive Deal", description: "", image: fallbackImage, store: storeName };
        }
        const idMatch = finalUrl.match(/[?&]product_id=(\d+)/i) || finalUrl.match(/\/s\/p\/([^/?]+)/i);
        if (idMatch && /^\d+$/.test(idMatch[1])) {
             image = `https://images.meesho.com/images/products/${idMatch[1]}/original_1.jpg`; 
             title = fallbackTitle || "Meesho Exclusive Deal";
        }
    }

    // --- STORE 3: FLIPKART, MYNTRA & OTHERS (With Proxy Bypass) ---
    if (storeName !== 'Amazon' && !image) {
        try {
          // 🚨 NAYA: Proxy Fetcher ko bulaya
          const html = await fetchHtmlWithProxy(finalUrl);
          
          if (html) {
            const $ = cheerio.load(html);

            // Flipkart Image Fixer
            if (storeName === 'Flipkart') {
               const fkImgMatch = html.match(/(https:\/\/rukminim2\.flixcart\.com\/image\/[^"'\s\\]+)/i);
               if (fkImgMatch && fkImgMatch[1]) image = fkImgMatch[1].replace(/{@width}|{@height}/g, '416');
               title = $('title').text().replace(/Buy .*?Online at Best Prices.*/i, '').trim();
            }

            $('script[type="application/ld+json"]').each((i, el) => {
              try {
                const data = JSON.parse($(el).html());
                const item = Array.isArray(data) ? data[0] : data;
                if (item && (item['@type'] === 'Product' || item.name)) {
                   if (!title && item.name) title = item.name;
                   if (!image && item.image) image = Array.isArray(item.image) ? item.image[0] : item.image;
                }
              } catch (e) { }
            });
            if (!title) title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
            if (!image) image = $('meta[property="og:image"]').attr('content') || '';
          }
        } catch (fetchHtmlError) {
          console.log("⚠️ HTML Fetch Failed, relying on fallback...");
        }
    }

    // --- FINAL FALLBACK CHECK ---
    if (!title || title.includes("Access Denied") || title.includes("Just a moment") || title.includes("Robot Check")) {
        title = fallbackTitle || `${storeName} Exclusive Deal`;
    }
    if (!image) image = fallbackImage;

    return {
      success: true,
      originalUrl: targetUrl,
      expandedUrl: finalUrl,
      store: storeName,
      title: title.replace(/\s+/g, ' ').trim(),
      description: "",
      image: image
    };

  } catch (error) {
    console.error("⛔ Scraper Critical Error:", error.message);
    return { success: false, title: "Exclusive Deal", description: "", image: "" };
  }
}