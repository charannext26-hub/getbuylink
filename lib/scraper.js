import * as cheerio from "cheerio";
import { fetchAmazonProductData } from "./amazonEngine";

// 1. ASIN EXTRACTOR
export function extractASIN(url) {
  const asinMatch = url.match(/\/(?:dp|gp\/product|exec\/obidos\/ASIN|o)\/([A-Z0-9]{10})/i);
  return asinMatch ? asinMatch[1] : null;
}

// 2. THE DEEP EXPANDER MACHINE (VERCEL PROOF)
export async function expandUrl(shortUrl, depth = 0) {
  if (depth > 3) return shortUrl; 

  try {
    console.log(`Deep Expand Level ${depth}:`, shortUrl);

    // Amazon Direct ASIN Check
    if ((shortUrl.includes('amazon.') || shortUrl.includes('amzn.')) && extractASIN(shortUrl)) {
        return shortUrl; 
    }

    // Lehlah API Bypass
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

    // 🚨 Vercel Timeout Protector (Max 3.5s per expand)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    let response;
    try {
      response = await fetch(shortUrl, {
        method: 'GET',
        redirect: isManualRedirect ? 'manual' : 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      throw fetchErr;
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location && !location.includes('play.google.com')) {
          const nextUrl = location.startsWith('http') ? location : new URL(location, shortUrl).href;
          return expandUrl(nextUrl, depth + 1);
      } else return shortUrl; 
    }

    let currentUrl = response.url;
    
    // Intermediate site JSON Hacker
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

// 3. STORE NAME DETECTOR
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

// 🚀 NAYA SOVRN API HELPER
async function fetchFromSovrn(url) {
  const secretKey = process.env.SOVRN_SECRET_KEY ? process.env.SOVRN_SECRET_KEY.replace(/"/g, '') : null;
  if (!secretKey) return null;

  try {
    console.log("⚡ Calling Sovrn Affiliate API for:", url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://api.sovrn.com/commerce/v1/products?url=${encodeURIComponent(url)}`, {
      headers: {
        'Authorization': `secret ${secretKey}`,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    
    // Sovrn JSON Extract (Checking multiple possible structures)
    let title = data.title || (data.items && data.items[0]?.title) || (data.data && data.data[0]?.title);
    let image = data.image || data.imageUrl || (data.items && data.items[0]?.image) || (data.data && data.data[0]?.image);
    let price = data.price || (data.items && data.items[0]?.price) || "Best Price";

    if (title && image) return { title, image, price };
    return null;
  } catch (e) {
    console.log("⚠️ Sovrn API Failed/Timeout:", e.message);
    return null; // Fallback pe jayega
  }
}

// 4. THE MASTER SCRAPER ENGINE
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
    
    // ==================================================
    // 🚀 STEP C: THE SOVRN API ATTACK (Primary Weapon)
    // ==================================================
    // Amazon ko chhod kar (kyunki uski official API best hai), baaki sab pehle Sovrn se try honge!
    if (storeName !== 'Amazon') {
        const sovrnData = await fetchFromSovrn(finalUrl);
        if (sovrnData) {
            console.log("🎉 SOVRN API SUCCESS! No scraping needed.");
            return {
                success: true,
                originalUrl: targetUrl,
                expandedUrl: finalUrl,
                store: storeName,
                title: sovrnData.title.replace(/\s+/g, ' ').trim(),
                description: "",
                image: sovrnData.image,
                price: sovrnData.price || "Best Price"
            };
        }
    }

    // ==================================================
    // 🛠️ STEP D: THE FALLBACKS (Agar Sovrn fail ho jaye)
    // ==================================================
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

    // --- STORE 3: FLIPKART, MYNTRA & OTHERS (HTML Scrape) ---
    if (storeName !== 'Amazon' && !image) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500); 
          const response = await fetch(finalUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          const html = await response.text();
          const $ = cheerio.load(html);

          // Flipkart JSON Hacker Backup
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