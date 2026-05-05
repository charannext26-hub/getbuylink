import * as cheerio from "cheerio";
import { fetchAmazonProductData } from "./amazonEngine";

// 1. THE DEEP EXPANDER MACHINE
export async function expandUrl(shortUrl, depth = 0) {
  if (depth > 4) return shortUrl; 

  try {
    console.log(`Deep Expand Level ${depth}:`, shortUrl);

    // --- LEHLAH API BYPASS ---
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

    const isMeeshoAppShortLink = shortUrl.includes('meesho.com/b');

    const response = await fetch(shortUrl, {
      method: 'GET',
      redirect: isMeeshoAppShortLink ? 'manual' : 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
      }
    });

    if (isMeeshoAppShortLink && response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location && !location.includes('play.google.com')) return expandUrl(location, depth + 1);
      else return shortUrl; 
    }

    let currentUrl = response.url;
    
    // Intermediate site brute force
    if (currentUrl.includes('wishlink.') || currentUrl.includes('cutt.ly') || currentUrl.includes('bit.ly') || currentUrl.includes('ltl.sh')) {
      const html = await response.text();
      const metaRefreshMatch = html.match(/url=(https?:\/\/[^"'>]+)/i);
      if (metaRefreshMatch && metaRefreshMatch[1]) return expandUrl(metaRefreshMatch[1], depth + 1);
      
      const jsMatch = html.match(/window\.location\.(?:href|replace)\s*=\s*["'](https?:\/\/[^"']+)["']/i);
      if (jsMatch && jsMatch[1]) return expandUrl(jsMatch[1], depth + 1);
      
      const hiddenEcomLink = html.match(/(https?:\/\/(?:www\.)?(?:flipkart\.com|amazon\.in|myntra\.com|ajio\.com|meesho\.com)[^"'\s\\]+)/i);
      if (hiddenEcomLink && hiddenEcomLink[1]) return expandUrl(hiddenEcomLink[1], depth + 1); 
    }

    return currentUrl;
  } catch (error) {
    return shortUrl; 
  }
}

export function extractASIN(url) {
  const asinMatch = url.match(/\/(?:dp|gp\/product|exec\/obidos\/ASIN|o)\/([A-Z0-9]{10})/i);
  return asinMatch ? asinMatch[1] : null;
}

// 🚀 NAYA HATHIYAR: STORE NAME DETECTOR
export function getStoreName(url) {
  if (url.includes('amazon.') || url.includes('amzn.')) return 'Amazon';
  if (url.includes('flipkart.com') || url.includes('fktr.in') || url.includes('dl.flipkart.com')) return 'Flipkart';
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

// 4. THE MASTER SCRAPER ENGINE
export async function getOgTags(targetUrl) {
  try {
    let fallbackTitle = "";
    let fallbackImage = "";

    // --- STEP A: PRE-SCRAPE WISHLINK/LEHLAH (The Mastermind Move) ---
    // Link expand hone se pehle hum intermediate site se unka data chura lenge
    try {
        const fbResponse = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const fbHtml = await fbResponse.text();
        const $fb = cheerio.load(fbHtml);
        
        fallbackTitle = $fb('meta[property="og:title"]').attr('content') || $fb('title').text() || '';
        fallbackImage = $fb('meta[property="og:image"]').attr('content') || '';

        // Faltu words hatana
        fallbackTitle = fallbackTitle.replace(/\|?\s*Lehlah\s*/i, '').replace(/Buy online.*/i, '').replace(/on Wishlink/i, '').trim();
    } catch (e) {
        console.log("Fallback capture skipped.");
    }

    // --- STEP B: LINK EXPANSION ---
    const finalUrl = await expandUrl(targetUrl);
    console.log("✅ Final Expanded URL:", finalUrl);
    const storeName = getStoreName(finalUrl);
    console.log("🛒 Store Detected:", storeName);

    let title = '';
    let image = '';

    // --- STORE 1: AMAZON (API Data Fetcher) ---
    if (storeName === 'Amazon') {
      const asin = extractASIN(finalUrl);
      if (asin) {
        console.log("🔥 AMAZON ASIN FOUND:", asin, "-> Calling PA-API!");
        
        // 🚨 NAYA API CALL YAHAN HAI 🚨
        const amazonData = await fetchAmazonProductData(asin);
        
        return {
          success: amazonData.success,
          originalUrl: targetUrl,
          expandedUrl: finalUrl,
          store: storeName,
          title: amazonData.title || "Amazon Exclusive Deal",
          description: "",
          image: amazonData.image || "", 
          // Note: Price aur Discount hum direct AI ya Webhook ko bhejenge
          price: amazonData.price || "Best Price", 
          discountPercent: amazonData.discountPercent || ""
        };
      }
    }

    // --- STORE 2: MEESHO (Smart Proxy Logic) ---
    if (finalUrl.includes("meesho.com")) {
        // Agar Wishlink/Lehlah ne photo de di hai, toh seedha wahi use karo! Meesho pe block mat khao.
        if (fallbackImage && fallbackImage.includes('http')) {
            console.log("🎯 Using Wishlink/Lehlah pre-scraped Image & Title for Meesho!");
            return {
                success: true,
                originalUrl: targetUrl,
                expandedUrl: finalUrl,
                title: fallbackTitle || "Meesho Exclusive Deal",
                description: "",
                image: fallbackImage
            };
        }
        // Agar Fallback na mile tab manual logic (last resort)
        const idMatch = finalUrl.match(/[?&]product_id=(\d+)/i) || finalUrl.match(/\/s\/p\/([^/?]+)/i);
        if (idMatch && /^\d+$/.test(idMatch[1])) {
             image = `https://images.meesho.com/images/products/${idMatch[1]}/original_1.jpg`; // .webp ki jagah .jpg use kar rahe hain
             title = fallbackTitle || "Meesho Exclusive Deal";
        }
    }

    // --- STORE 3: FLIPKART, MYNTRA & OTHERS (Standard) ---
    // Agar Meesho nahi hai, ya Meesho ka fallback nahi mila, tabhi normal scrape karo
    if (!finalUrl.includes("meesho.com") || (finalUrl.includes("meesho.com") && !image)) {
        const response = await fetch(finalUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        });
        const html = await response.text();
        const $ = cheerio.load(html);

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
        if (!image) image = $('img').map((i, el) => $(el).attr('src')).get().find(src => src && src.startsWith('http') && !src.includes('logo')) || '';
    }

    // --- FINAL FALLBACK CHECK ---
    if (!title || title.includes("Access Denied") || title.includes("Just a moment")) title = fallbackTitle || "Exclusive Deal";
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
    return { success: false, title: "Exclusive Deal", description: "", image: "" };
  }
}
