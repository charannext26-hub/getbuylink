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

    // 1. 🖼️ CORE DATA
    const title = $('meta[property="og:title"]').attr("content") || $("title").text().trim();
    const image = $('meta[property="og:image"]').attr("content") || $('img.product-image').attr("src") || $('img._396cs4').attr("src");

    let offerPrice = null;
    let mrp = null;
    let discount = null;
    let description = [];
    let bestRawLink = null;
    let extractedOffers = [];

    // 🚀 SPECIAL SHOPSY / FLIPKART DIRECT LINK HANDLER
    if (targetUrl.includes("shopsy.in") || targetUrl.includes("flipkart.com") || targetUrl.includes("amazon.in")) {
        debugLog.push("Direct Store Link detected. Using Direct Scrape Engine.");
        
        // 1. Offer Price Extraction (Already working, but making it robust)
        // Flipkart/Shopsy ke common classes: _30jeq3, Nx9bqj. Amazon: a-price-whole
        const priceText = $('div._30jeq3, div.Nx9bqj, span.a-price-whole').first().text() || 
                          $('div[class*="price"], span[class*="price"]').filter(function() { return $(this).text().includes('₹'); }).first().text();
        
        // 2. MRP Extraction (The Fix!)
        // Flipkart/Shopsy ke common classes: _3I9_wc, yRaY8j. Amazon: a-text-strike
        const mrpText = $('div._3I9_wc, div.yRaY8j, span.a-text-strike').first().text() || 
                        $('div[class*="strike"], span[class*="strike"], s').filter(function() { return $(this).text().includes('₹'); }).first().text();
        
        // 3. Discount Extraction (The Fix!)
        // Flipkart/Shopsy ke common classes: _3Ay6Sb, UkUFwK. Amazon: savingPriceOverride
        const discountText = $('div._3Ay6Sb, div.UkUFwK, span.savingPriceOverride').first().text() || 
                             $('div[class*="discount"], span[class*="discount"]').filter(function() { return $(this).text().includes('%'); }).first().text();

        // Data Cleanup: Sirf numbers nikalna
        if (priceText) offerPrice = priceText.replace(/[^0-9]/g, '');
        if (mrpText) mrp = mrpText.replace(/[^0-9]/g, '');
        if (discountText) {
             const distMatch = discountText.match(/([0-9]+)\s*%/);
             if (distMatch) discount = distMatch[1];
        }
        
        // Agar HTML DOM se Price/MRP na mile, toh Script JSON se nikalne ka try karo (Fallback)
        if (!offerPrice || !mrp) {
            debugLog.push("DOM classes failed. Trying Regex on raw HTML...");
            
            // Flipkart/Shopsy aksar price details ek window.__INITIAL_STATE__ script me rakhte hain
            const scriptData = $('script#is_script').html() || html;
            
            if (!offerPrice) {
                 const fallbackPrice = scriptData.match(/"price":\s*([0-9]+)/) || scriptData.match(/"specialPrice":\s*([0-9]+)/);
                 if (fallbackPrice) offerPrice = fallbackPrice[1];
            }
            if (!mrp) {
                 const fallbackMrp = scriptData.match(/"mrp":\s*([0-9]+)/) || scriptData.match(/"price":\s*([0-9]+)/g);
                 // Agar do price tag mile, toh bada wala MRP hota hai
                 if (fallbackMrp && fallbackMrp.length > 1) {
                     let prices = fallbackMrp.map(p => parseInt(p.match(/[0-9]+/)[0]));
                     mrp = Math.max(...prices);
                 }
            }
            if (!discount && offerPrice && mrp) {
                 // Agar discount nahi mila par MRP aur Price mil gaya, toh khud calculate kar lo!
                 const calcDiscount = Math.round(((mrp - offerPrice) / mrp) * 100);
                 if (calcDiscount > 0) discount = calcDiscount;
            }
        }

        bestRawLink = targetUrl; // Store link khud hi raw link hota hai!
    }
    // 🌐 DEAL SITES (DealsMagnet, DealsSpy) HANDLER
    else {
        const pageText = $('body').text().replace(/\s+/g, ' '); 

        // Price, MRP, Discount Extraction
        const priceMatch = pageText.match(/(?:offer price|deal price|price)[\s:]*₹?\s*([0-9,]+)/i) || pageText.match(/₹\s*([0-9,]+)/i);
        if (priceMatch) offerPrice = priceMatch[1].replace(/,/g, '');

        const mrpMatch = pageText.match(/mrp[\s:]*₹?\s*([0-9,]+)/i) || pageText.match(/₹([0-9,]+)\s*\(Save/i);
        if (mrpMatch) mrp = mrpMatch[1].replace(/,/g, '');

        const discountMatch = pageText.match(/discount[\s:]*([0-9]+)\s*%/i) || pageText.match(/([0-9]+)\s*%\s*(?:off|discount)/i);
        if (discountMatch) discount = discountMatch[1];

        // 🎟️ COUPON & BANK OFFER EXTRACTOR
        // Ye logic page me chhupe hue "Apply Coupon" ya "HDFC/SBI Bank" offers ko pakdega
        $('div, span, strong, b').each((i, el) => {
            const txt = $(el).text().trim();
            const lowerTxt = txt.toLowerCase();
            if ((lowerTxt.includes("coupon") || lowerTxt.includes("bank cc") || lowerTxt.includes("hdfc") || lowerTxt.includes("sbi")) && txt.length > 5 && txt.length < 80) {
                extractedOffers.push(txt);
            }
        });

        // 📝 CLEAN DESCRIPTION EXTRACTOR (Footer Bypass)
        $('ul li').each((i, el) => {
            const text = $(el).text().trim();
            const lowerText = text.toLowerCase();
            
            // Faltu words filter karna (Legal, Telegram, etc.)
            const isGarbage = lowerText.includes("telegram") || lowerText.includes("whatsapp") || 
                              lowerText.includes("disclaimer") || lowerText.includes("privacy policy") || 
                              lowerText.includes("terms of service") || lowerText.includes("legal purpose") || 
                              lowerText.includes("property of their") || lowerText.includes("compensated");

            if(text.length > 25 && text.length < 500 && !isGarbage) {
                description.push(text);
            }
        });

        // 🔗 DATA-CODE HIJACKER & DECODER
        let dataCode = null;
        const buyButton = $('button.buy-button, button.BuyNowButton, [data-code], [data-url]');
        if (buyButton.length > 0) dataCode = buyButton.attr('data-code') || buyButton.attr('data-url');

        if (dataCode) {
            const urlObj = new URL(targetUrl);
            let apiUrl = `${urlObj.origin}/buy?${dataCode}`;
            const base64Match = dataCode.match(/utm_content=(aHR0c[a-zA-Z0-9+/=]+)/);
            
            if (base64Match) {
                 try {
                     const decodedString = Buffer.from(base64Match[1], 'base64').toString('utf-8');
                     const extractedLinkMatch = decodedString.match(/(https?:\/\/(?:www\.|dl\.)?(?:amazon\.in|amzn\.to|flipkart\.com|myntra\.com)[\S]+)/i);
                     if (extractedLinkMatch) bestRawLink = extractedLinkMatch[1];
                 } catch (e) {}
            } 
            
            if (!bestRawLink) {
                 let maxRedirects = 3;
                 let currentUrl = apiUrl;

                 while (maxRedirects > 0) {
                     try {
                         const redirectRes = await fetch(currentUrl, {
                             method: 'GET',
                             redirect: 'manual', 
                             headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Referer": targetUrl }
                         });

                         if (redirectRes.status >= 300 && redirectRes.status < 400) {
                             const location = redirectRes.headers.get("location");
                             if (location.includes("/redirects/") || (location.includes(urlObj.hostname) && !location.includes("amazon") && !location.includes("flipkart"))) {
                                 currentUrl = location.startsWith('/') ? urlObj.origin + location : location;
                             } else {
                                 bestRawLink = location;
                                 break;
                             }
                         } else {
                             const redirectHtml = await redirectRes.text();
                             const metaRefresh = redirectHtml.match(/url=(https?:\/\/[^"'>]+)/i);
                             if (metaRefresh) bestRawLink = metaRefresh[1];
                             else {
                                  const amznMatch = redirectHtml.match(/(https?:\/\/(?:www\.)?amazon\.in\/[^\s'"><\\]+)/i);
                                  if (amznMatch) bestRawLink = amznMatch[1];
                             }
                             break; 
                         }
                     } catch (e) { break; }
                     maxRedirects--;
                 }
            }
        } 
    }

    // 🧹 URL CLEANER (Myntra/Ajio Linkredirect Bypass)
    if (bestRawLink && (bestRawLink.includes("dl=http") || bestRawLink.includes("url=http"))) {
        try {
            const parsedUrl = new URL(bestRawLink);
            // Ajio/Myntra links 'url=' parameter me hote hain, Flipkart 'dl=' me
            const secretParam = parsedUrl.searchParams.get("dl") || parsedUrl.searchParams.get("url");
            if (secretParam) {
                bestRawLink = decodeURIComponent(secretParam);
            }
        } catch(e) {}
    }
    
    if (bestRawLink) bestRawLink = bestRawLink.replace(/[\\"'>)}]/g, '');

    // Final Offer Array cleanup
    const uniqueOffers = [...new Set(extractedOffers)];

    return NextResponse.json({
      success: true,
      data: {
        title,
        image,
        offerPrice: offerPrice ? Number(offerPrice) : null,
        mrp: mrp ? Number(mrp) : null,
        discountPercentage: discount ? Number(discount) : null,
        extraOffers: uniqueOffers.length > 0 ? uniqueOffers : null, // 🎟️ Naya Data!
        description: description, 
        bestRawLink: bestRawLink || "Link still hidden.",
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}