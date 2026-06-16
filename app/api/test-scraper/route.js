import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) return NextResponse.json({ success: false, message: "URL is required" }, { status: 400 });

    let debugLog = [];
    debugLog.push(`➡️ Target: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(10000) 
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr("content") || $("title").text().trim();
    const image = $('meta[property="og:image"]').attr("content");

    let bestRawLink = null;
    let dataCode = null;
    
    // 1. Data Code Extract Karna
    const buyButton = $('button.buy-button, button.BuyNowButton, [data-code], [data-url]');
    if (buyButton.length > 0) {
        dataCode = buyButton.attr('data-code') || buyButton.attr('data-url');
    }

    if (dataCode) {
        debugLog.push(`Gotcha! Extracted data-code: ${dataCode}`);
        const urlObj = new URL(targetUrl);
        let apiUrl = `${urlObj.origin}/buy?${dataCode}`;
        
        // 🔥 THE BASE64 DECODER (DealsSpy's ultimate weakness)
        // Check karte hain agar URL mein 'aHR0c' (https:// in Base64) chhipa hai
        const base64Match = dataCode.match(/utm_content=(aHR0c[a-zA-Z0-9+/=]+)/);
        
        if (base64Match) {
             debugLog.push("Base64 Encoded string detected! Decrypting...");
             try {
                 // Base64 string ko decode karna
                 const decodedString = Buffer.from(base64Match[1], 'base64').toString('utf-8');
                 
                 // Decode hone ke baad usme se Flipkart/Amazon ka link nikalna
                 const extractedLinkMatch = decodedString.match(/(https?:\/\/(?:www\.|dl\.)?(?:amazon\.in|amzn\.to|flipkart\.com|myntra\.com)[\S]+)/i);
                 
                 if (extractedLinkMatch) {
                     bestRawLink = extractedLinkMatch[1];
                     debugLog.push("✅ SUCCESS! Link decrypted from Base64 string.");
                 } else {
                     debugLog.push(`Decrypted string didn't contain direct store link. Decrypted value: ${decodedString}`);
                 }
             } catch (e) {
                 debugLog.push("Decryption failed: " + e.message);
             }
        } 
        
        // Agar Base64 nahi mila, ya DealsMagnet ka code hua, toh purana API tracer chalega
        if (!bestRawLink) {
             debugLog.push("No Base64 found or Decryption failed. Falling back to API Hijacker...");
             let maxRedirects = 3;
             let currentUrl = apiUrl;

             while (maxRedirects > 0) {
                 debugLog.push(`Hitting: ${currentUrl}`);
                 try {
                     const redirectRes = await fetch(currentUrl, {
                         method: 'GET',
                         redirect: 'manual', 
                         headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Referer": targetUrl }
                     });

                     if (redirectRes.status >= 300 && redirectRes.status < 400) {
                         const location = redirectRes.headers.get("location");
                         
                         // DealSpy ka /redirects/route catch karna (Jo Image 2 me tha)
                         if (location.includes("/redirects/")) {
                             debugLog.push("Caught /redirects/ route. Following one last time...");
                             currentUrl = location.startsWith('/') ? urlObj.origin + location : location;
                         }
                         else if (location.includes(urlObj.hostname) && !location.includes("amazon") && !location.includes("flipkart")) {
                             debugLog.push("Intermediary redirect caught. Bouncing again...");
                             currentUrl = location.startsWith('/') ? urlObj.origin + location : location;
                         } else {
                             bestRawLink = location;
                             debugLog.push("✅ SUCCESS! Final Link caught.");
                             break;
                         }
                     } else {
                         const redirectHtml = await redirectRes.text();
                         const metaRefresh = redirectHtml.match(/url=(https?:\/\/[^"'>]+)/i);
                         
                         if (metaRefresh) {
                             bestRawLink = metaRefresh[1];
                             debugLog.push("✅ SUCCESS! Link caught from Meta Refresh!");
                         } else {
                              const amznMatch = redirectHtml.match(/(https?:\/\/(?:www\.)?amazon\.in\/[^\s'"><\\]+)/i);
                              if (amznMatch) bestRawLink = amznMatch[1];
                         }
                         break; 
                     }
                 } catch (e) {
                     debugLog.push("Bounce failed: " + e.message);
                     break;
                 }
                 maxRedirects--;
             }
        }
    } 

    // 🔥 URL DECODER (For DealsMagnet's Flipkart/Linkredirect links)
    if (bestRawLink && bestRawLink.includes("dl=http")) {
        try {
            const parsedUrl = new URL(bestRawLink);
            const dlParam = parsedUrl.searchParams.get("dl");
            if (dlParam) {
                bestRawLink = decodeURIComponent(dlParam);
                debugLog.push("Cleaned up encoded 3rd-party URL.");
            }
        } catch(e) {}
    }

    if (bestRawLink) bestRawLink = bestRawLink.replace(/[\\"'>)}]/g, '');

    return NextResponse.json({
      success: true,
      data: {
        title,
        image,
        bestRawLink: bestRawLink || "Link still hidden.",
        debugLog
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}