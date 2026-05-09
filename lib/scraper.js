import * as cheerio from "cheerio";
import { fetchAmazonProductData } from "./amazonEngine";

export function extractASIN(url) {
  const asinMatch = url.match(/\/(?:dp|gp\/product|exec\/obidos\/ASIN|o)\/([A-Z0-9]{10})/i);
  return asinMatch ? asinMatch[1] : null;
}

// ⏱️ FAST TIMEOUT ENGINE 
async function fetchWithTimeout(resource, options = {}, timeoutMs) {
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

// ==========================================
// 🚀 SMART ROUTING 4-LAYER FETCHER
// ==========================================
async function fetchHtmlWithFallback(url, storeName) { 
  let finalHtml = null;

  // 🧠 ROUTING FLAGS (Kon sa layer chalega, kon sa nahi)
  let runLayer1 = true;
  let runLayer2 = true;
  let runLayer3 = true;
  let runLayer4 = true;

  if (storeName === 'Flipkart') {
      console.log("🎯 STRICT ROUTING: Flipkart -> Only Layer 2 (Microlink) for Testing.");
      runLayer1 = false;
      runLayer2 = true;  
      runLayer3 = false; 
      runLayer4 = false;
  } else if (storeName === 'Myntra' || storeName === 'Ajio') {
      console.log("🎯 STRICT ROUTING: Myntra/Ajio -> Direct to Layer 3 (Scrape.do) to save time!");
      runLayer1 = false; 
      runLayer2 = false; 
      runLayer3 = true;  
      runLayer4 = false; 
  } else if (storeName === 'Meesho') {
      console.log("🛑 COST SAVER ROUTING: Meesho -> Only Free Layers (1 & 4). Scrape.do BLOCKED!");
      runLayer1 = true;  // Try Vercel (Free)
      runLayer2 = false; // Skip Microlink (Avoid fake JSON)
      runLayer3 = false; // 🚨 STRICTLY SKIP Scrape.do to save 10 credits
      runLayer4 = true;  // Try AllOrigins (Free)
  }

  // 🧠 SMART BLOCK & FAKE SUCCESS DETECTOR
  const isBlocked = (htmlOrTitle, isHtml = true) => {
      if (!htmlOrTitle) return true;
      const text = htmlOrTitle.toLowerCase();
      
      if (isHtml) {
          if (htmlOrTitle.length > 50000) return false; 
          return text.includes("<title>access denied") || text.includes("<title>just a moment") || text.includes("robot check") || text.includes("are you a human");
      } else {
          if (text.length < 15) return true;
          if (text.includes("online shopping") || text === "meesho" || text === "myntra" || text === "ajio" || text.includes("buy clothes")) return true;
          return false;
      }
  };

  // 🟢 LAYER 1: DIRECT VERCEL FETCH (Timeout: 4s)
  if (runLayer1 && !finalHtml) {
      try {
        console.log(`➡️ Trying Layer 1 (Vercel): ${url}`);
        const res1 = await fetchWithTimeout(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-IN,en;q=0.9',
          }
        }, 4000); 
        
        if (res1.ok) {
           const html = await res1.text();
           if (!isBlocked(html, true)) {
               console.log("✅ Layer 1 Success!");
               finalHtml = html;
           } else console.log("⚠️ Layer 1 Blocked by Store Security.");
        }
      } catch (e) { console.log("⚠️ Layer 1 Failed/Timeout"); }
  }

  // 🔵 LAYER 2: MICROLINK (Timeout: 15s) 
  if (runLayer2 && !finalHtml) {
      try {
          console.log("➡️ Trying Layer 2 (Microlink)...");
          const resMicro = await fetchWithTimeout(`https://api.microlink.io?url=${encodeURIComponent(url)}`, {
              headers: { 'User-Agent': 'Mozilla/5.0' }
          }, 15000); 
          
          if (resMicro.status !== 429 && resMicro.ok) {
              const microData = await resMicro.json();
              if (microData && microData.status === "success" && microData.data) {
                  const extractedTitle = microData.data.title || "";
                  const extractedImage = microData.data.image ? microData.data.image.url : "";
                  
                  if (extractedTitle && !isBlocked(extractedTitle, false)) {
                      console.log("✅ Layer 2 (Microlink) Clean JSON Success!");
                      finalHtml = `<title>${extractedTitle}</title><meta property="og:image" content="${extractedImage}">`;
                  } else {
                      console.log("⚠️ Layer 2 Gave Fake/Generic Data. Rejecting.");
                  }
              }
          } else console.log(`⚠️ Layer 2 Rate Limited or Failed. Status: ${resMicro.status}`);
      } catch(e) { console.log("⚠️ Layer 2 Failed/Timeout:", e.message); }
  }

  // 🟣 LAYER 3: MULTI-TOKEN SCRAPE.DO LOOP (Timeout: 20s per token)
  if (runLayer3 && !finalHtml) {
      const tokens = [
          process.env.SCRAPER_DO_TOKEN,
          process.env.SCRAPER_DO_TOKEN_2,
          process.env.SCRAPER_DO_TOKEN_3,
          process.env.SCRAPER_DO_TOKEN_4
      ].filter(t => t); 
      
      for (let i = 0; i < tokens.length; i++) {
          const scrapeDoToken = tokens[i].replace(/"/g, '').trim();
          try {
              console.log(`➡️ Trying Layer 3 (Scrape.do) with Token #${i + 1}...`);
              let apiUrl = `http://api.scrape.do?token=${scrapeDoToken}&url=${encodeURIComponent(url)}`;
              
              const res2 = await fetchWithTimeout(apiUrl, {}, 20000); // 20 seconds
              if (res2.ok) {
                  const html = await res2.text();
                  if (!isBlocked(html, true)) {
                      console.log(`✅ Layer 3 Success with Token #${i + 1}!`);
                      finalHtml = html;
                      break; // Data mil gaya, loop ko stop karo!
                  } else console.log("⚠️ Layer 3 Blocked.");
              } else if (res2.status === 401 || res2.status === 403 || res2.status === 429) {
                  console.log(`⚠️ Token #${i + 1} Limit Reached or Blocked. Switching to next Token...`);
                  continue; // Agle token par jao
              } else {
                  console.log(`⚠️ Layer 3 Failed with status: ${res2.status}`);
                  break; // Koi bada error hai, loop tod do
              }
          } catch(e) { 
              console.log("⚠️ Layer 3 Failed/Timeout"); 
              break; 
          }
      }
      if(!finalHtml) console.log("⚠️ All Layer 3 Tokens exhausted or failed.");
  }

  // 🟠 LAYER 4: ALLORIGINS PROXY (Timeout: 5s)
  if (runLayer4 && !finalHtml) {
      try {
          console.log("➡️ Trying Layer 4 (AllOrigins)...");
          const res3 = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, {}, 5000); 
          const data3 = await res3.json();
          if (data3 && data3.contents && !isBlocked(data3.contents, true)) {
              console.log("✅ Layer 4 Success!");
              finalHtml = data3.contents;
          }
      } catch(e) { console.log("⚠️ Layer 4 Failed/Timeout"); }
  }

  return finalHtml; 
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
      const response = await fetchWithTimeout("https://app.lehlah.club/api/generate-redirect-url-in-app-redirection", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "short_code": shortCode, "is_telegram": true })
      }, 4000);
      const lehlahData = await response.json();
      if (lehlahData && lehlahData.redirect_url) return expandUrl(lehlahData.redirect_url, depth + 1);
    }

    const isManualRedirect = shortUrl.includes('meesho.com/b') || shortUrl.includes('amzn.to') || shortUrl.includes('amzn.in/') || shortUrl.includes('fkrt.it');

    let response;
    try {
      response = await fetchWithTimeout(shortUrl, {
        method: 'GET',
        redirect: isManualRedirect ? 'manual' : 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, 4000);
    } catch (fetchErr) { throw fetchErr; }

    if (response.status === 403 || response.status === 503 || response.status === 400) {
      try {
        const apiRes = await fetchWithTimeout(`https://unshorten.me/json/${encodeURIComponent(shortUrl)}`, {}, 3000);
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
      if (redirectJsonMatch && redirectJsonMatch[1]) return expandUrl(redirectJsonMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, ''), depth + 1);
      const metaRefreshMatch = html.match(/url=(https?:\/\/[^"'>]+)/i);
      if (metaRefreshMatch && metaRefreshMatch[1]) return expandUrl(metaRefreshMatch[1], depth + 1);
      const hiddenEcomLink = html.match(/(https?:\/\/(?:www\.)?(?:flipkart\.com|dl\.flipkart\.com|amazon\.in|myntra\.com|ajio\.com|meesho\.com)[^"'\s\\]+)/i);
      if (hiddenEcomLink && hiddenEcomLink[1]) return expandUrl(hiddenEcomLink[1], depth + 1); 
    }

    return currentUrl;
  } catch (error) { return shortUrl; }
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
  } catch (e) { return 'Other Store'; }
}

// 3. THE MASTER SCRAPER ENGINE
export async function getOgTags(targetUrl) {
  try {
    let fallbackTitle = "";
    let fallbackImage = "";

    try {
        const fbResponse = await fetchWithTimeout(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 3000);
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
    let discountPercent = ""; 

    // --- STORE 1: AMAZON ---
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

    // --- STORE 2: FLIPKART, MYNTRA & OTHERS ---
    try {
      const html = await fetchHtmlWithFallback(finalUrl, storeName);
      
      if (html) {
        const $ = cheerio.load(html);

        if (storeName === 'Flipkart') {
           const fkImgMatch = html.match(/(https:\/\/rukminim2\.flixcart\.com\/image\/[^"'\s\\]+)/i);
           if (fkImgMatch && fkImgMatch[1]) image = fkImgMatch[1].replace(/{@width}|{@height}/g, '416');
           title = $('title').text().replace(/Buy .*?Online at Best Prices.*/i, '').trim();
           
           let extractedPrice = $('div._30jeq3._16Jk6d').text().trim() || $('div.Nx9-qj').text().trim() || $('meta[property="product:price:amount"]').attr('content') || "";
           if(extractedPrice && extractedPrice.length < 15) price = extractedPrice;
           discountPercent = $('div._3Ay6B5').text().trim() || $('div.UkUFwK').text().trim() || "";
        }

        if (storeName === 'Meesho') {
            const idMatch = finalUrl.match(/[?&]product_id=(\d+)/i) || finalUrl.match(/\/s\/p\/([^/?]+)/i);
            if (idMatch && /^\d+$/.test(idMatch[1])) {
                 image = `https://images.meesho.com/images/products/${idMatch[1]}/original_1.jpg`; 
            }
        }

        $('script[type="application/ld+json"]').each((i, el) => {
          try {
            const data = JSON.parse($(el).html());
            const item = Array.isArray(data) ? data[0] : data;
            if (item && (item['@type'] === 'Product' || item.name)) {
               if (!title && item.name) title = item.name;
               if (!image && item.image) image = Array.isArray(item.image) ? item.image[0] : item.image;
               if (item.offers && item.offers.price) price = `₹${item.offers.price}`;
               if (!discountPercent && item.offers && item.offers.discount) discountPercent = `${item.offers.discount}% OFF`;
            }
          } catch (e) { }
        });

        if (!title) title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
        if (!image) image = $('meta[property="og:image"]').attr('content') || '';
      }
    } catch (fetchHtmlError) {
      console.log("⚠️ HTML Fetch Failed, relying on fallback...");
    }

    // FINAL REFINEMENTS
    if (!title || title.toLowerCase().includes("access denied") || title.length < 5) {
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
      price: price,
      discountPercent: discountPercent 
    };

  } catch (error) {
    console.error("⛔ Scraper Critical Error:", error.message);
    return { success: false, title: "Exclusive Deal", description: "", image: "", price: "", discountPercent: "" };
  }
}