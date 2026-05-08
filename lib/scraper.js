import * as cheerio from "cheerio";
import { fetchAmazonProductData } from "./amazonEngine";

export function extractASIN(url) {
  const asinMatch = url.match(/\/(?:dp|gp\/product|exec\/obidos\/ASIN|o)\/([A-Z0-9]{10})/i);
  return asinMatch ? asinMatch[1] : null;
}

// ==========================================
// 🚀 THE BULLETPROOF 4-LAYER FETCHER
// ==========================================
async function fetchHtmlWithFallback(url) {
  let finalHtml = null;

  // 🧠 SMART BLOCK DETECTOR (Size based & Title based)
  const isBlocked = (html) => {
      if (!html) return true;
      // Agar Flipkart/Myntra ka page 50,000 characters se bada hai, toh wo 100% asli data hai, Captcha nahi.
      if (html.length > 50000) return false; 
      
      const lowerHtml = html.toLowerCase();
      return lowerHtml.includes("<title>access denied") || 
             lowerHtml.includes("<title>just a moment") || 
             lowerHtml.includes("robot check");
  };

  // 🟢 LAYER 1: DIRECT VERCEL FETCH (Fastest)
  try {
    console.log(`➡️ Trying Layer 1 (Vercel): ${url}`);
    const res1 = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-IN,en;q=0.9',
      }
    });
    if (res1.ok) {
       const html = await res1.text();
       if (!isBlocked(html)) {
           console.log("✅ Layer 1 Success!");
           finalHtml = html;
       } else console.log("⚠️ Layer 1 Blocked by Store Security.");
    }
  } catch (e) { console.log("⚠️ Layer 1 Network Error"); }

  // 🔵 LAYER 2: MICROLINK (Free 50/day - JSON Format Bypass)
  if (!finalHtml) {
      try {
          console.log("➡️ Trying Layer 2 (Microlink)...");
          const resMicro = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&prerender=true&meta=false`);
          if (resMicro.status !== 429) {
              const microData = await resMicro.json();
              if (microData && microData.data && microData.data.html) {
                  const html = microData.data.html;
                  if (!isBlocked(html)) {
                      console.log("✅ Layer 2 (Microlink) Success!");
                      finalHtml = html;
                  } else console.log("⚠️ Layer 2 Blocked.");
              }
          } else console.log("⚠️ Layer 2 (Microlink) Rate Limited (50/day done).");
      } catch(e) { console.log("⚠️ Layer 2 Error"); }
  }

  // 🟣 LAYER 3: SCRAPE.DO (The Heavy Lifter - 1000 Free Req/Month)
  if (!finalHtml) {
      const scrapeDoToken = process.env.SCRAPER_DO_TOKEN?.replace(/"/g, '').trim();
      if (scrapeDoToken) {
          try {
              console.log("➡️ Trying Layer 3 (Scrape.do)...");
              const res2 = await fetch(`http://api.scrape.do?token=${scrapeDoToken}&url=${encodeURIComponent(url)}`);
              if (res2.ok) {
                  const html = await res2.text();
                  if (!isBlocked(html)) {
                      console.log("✅ Layer 3 (Scrape.do) Success!");
                      finalHtml = html;
                  } else console.log("⚠️ Layer 3 Blocked.");
              } else console.log(`⚠️ Layer 3 Failed with status: ${res2.status}`);
          } catch(e) { console.log("⚠️ Layer 3 Error"); }
      } else console.log("⚠️ Layer 3 Skipped: SCRAPER_DO_TOKEN not found.");
  }

  // 🟠 LAYER 4: ALLORIGINS PROXY (The Free Backup)
  if (!finalHtml) {
      try {
          console.log("➡️ Trying Layer 4 (AllOrigins)...");
          const res3 = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
          const data3 = await res3.json();
          if (data3 && data3.contents && !isBlocked(data3.contents)) {
              console.log("✅ Layer 4 Success!");
              finalHtml = data3.contents;
          }
      } catch(e) { console.log("⚠️ Layer 4 Error"); }
  }

  return finalHtml; // Will return null if ALL layers fail
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

    try {
        const fbResponse = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const fbHtml = await fbResponse.text();
        const $fb = cheerio.load(fbHtml);
        fallbackTitle = $fb('meta[property="og:title"]').attr('content') || $fb('title').text() || '';
        fallbackImage = $fb('meta[property="og:image"]').attr('content') || '';
        fallbackTitle = fallbackTitle.replace(/\|?\s*Lehlah\s*/i, '').replace(/Buy online.*/i, '').replace(/on Wishlink/i, '').trim();
    } catch (e) {}

    const finalUrl = await expandUrl(targetUrl);
    console.log("✅ Final Expanded URL:", finalUrl);
    const storeName = getStoreName(finalUrl);

    let title = '';
    let image = '';
    let price = ""; 

    if (storeName === 'Amazon') {
      const asin = extractASIN(finalUrl);
      if (asin) {
        const amazonData = await fetchAmazonProductData(asin, finalUrl);
        let safePrice = amazonData.price || "";
        if (safePrice.length > 20 || safePrice.toLowerCase().includes("check price") || safePrice.toLowerCase().includes("best price")) {
            safePrice = "";
        }
        return {
          success: amazonData.success, originalUrl: targetUrl, expandedUrl: finalUrl, store: storeName,
          title: amazonData.title || "Amazon Exclusive Deal", description: "", image: amazonData.image || "", 
          price: safePrice, discountPercent: amazonData.discountPercent || ""
        };
      }
    }

    if (storeName === 'Meesho') {
        if (fallbackImage && fallbackImage.includes('http')) {
            return { success: true, originalUrl: targetUrl, expandedUrl: finalUrl, title: fallbackTitle || "Meesho Exclusive Deal", description: "", image: fallbackImage, store: storeName, price: "" };
        }
        const idMatch = finalUrl.match(/[?&]product_id=(\d+)/i) || finalUrl.match(/\/s\/p\/([^/?]+)/i);
        if (idMatch && /^\d+$/.test(idMatch[1])) {
             image = `https://images.meesho.com/images/products/${idMatch[1]}/original_1.jpg`; 
             title = fallbackTitle || "Meesho Exclusive Deal";
        }
    }

    // --- STORE 3: FLIPKART, MYNTRA & OTHERS (With 4-Layer System) ---
    if (storeName !== 'Amazon' && !image) {
        try {
          const html = await fetchHtmlWithFallback(finalUrl);
          
          if (html) {
            const $ = cheerio.load(html);

            if (storeName === 'Flipkart') {
               const fkImgMatch = html.match(/(https:\/\/rukminim2\.flixcart\.com\/image\/[^"'\s\\]+)/i);
               if (fkImgMatch && fkImgMatch[1]) image = fkImgMatch[1].replace(/{@width}|{@height}/g, '416');
               title = $('title').text().replace(/Buy .*?Online at Best Prices.*/i, '').trim();
               
               let extractedPrice = $('div._30jeq3._16Jk6d').text().trim() || $('div.Nx9-qj').text().trim() || $('meta[property="product:price:amount"]').attr('content') || "";
               if(extractedPrice && extractedPrice.length < 15) price = extractedPrice;
            }

            $('script[type="application/ld+json"]').each((i, el) => {
              try {
                const data = JSON.parse($(el).html());
                const item = Array.isArray(data) ? data[0] : data;
                if (item && (item['@type'] === 'Product' || item.name)) {
                   if (!title && item.name) title = item.name;
                   if (!image && item.image) image = Array.isArray(item.image) ? item.image[0] : item.image;
                   if (item.offers && item.offers.price) price = `₹${item.offers.price}`;
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

    if (!title || title.toLowerCase().includes("access denied") || title.toLowerCase().includes("just a moment") || title.toLowerCase().includes("robot check")) {
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
      image: image,
      price: price
    };

  } catch (error) {
    console.error("⛔ Scraper Critical Error:", error.message);
    return { success: false, title: "Exclusive Deal", description: "", image: "", price: "" };
  }
}