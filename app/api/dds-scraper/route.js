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
    let title = $('meta[property="og:title"]').attr("content") || $("title").text().trim();
    let image = $('meta[property="og:image"]').attr("content") || $('img.product-image').attr("src") || $('img._396cs4').attr("src");

    let offerPrice = null;
    let mrp = null;
    let discount = null;
    let description = [];
    let bestRawLink = null;
    let extractedOffers = [];

    // 🚀 SPECIAL SHOPSY / FLIPKART DIRECT LINK HANDLER
    const lowerUrl = targetUrl.toLowerCase();
    if (lowerUrl.includes("shopsy") || lowerUrl.includes("flipkart") || lowerUrl.includes("amazon") || lowerUrl.includes("amzn")) {
        debugLog.push("Direct Store Link detected. Using Direct Scrape Engine.");
        
        const priceText = $('div._30jeq3, div.Nx9bqj, span.a-price-whole').first().text() || 
                          $('div[class*="price"], span[class*="price"]').filter(function() { return $(this).text().includes('₹'); }).first().text();
        
        const mrpText = $('div._3I9_wc, div.yRaY8j, span.a-text-strike').first().text() || 
                        $('div[class*="strike"], span[class*="strike"], s').filter(function() { return $(this).text().includes('₹'); }).first().text();
        
        const discountText = $('div._3Ay6Sb, div.UkUFwK, span.savingPriceOverride').first().text() || 
                             $('div[class*="discount"], span[class*="discount"]').filter(function() { return $(this).text().includes('%'); }).first().text();

        if (priceText) offerPrice = priceText.replace(/[^0-9]/g, '');
        if (mrpText) mrp = mrpText.replace(/[^0-9]/g, '');
        if (discountText) {
             const distMatch = discountText.match(/([0-9]+)\s*%/);
             if (distMatch) discount = distMatch[1];
        }
        
        if (!offerPrice || !mrp) {
            const scriptData = $('script#is_script').html() || html;
            
            if (!offerPrice) {
                 const fallbackPrice = scriptData.match(/"price":\s*([0-9]+)/) || scriptData.match(/"specialPrice":\s*([0-9]+)/);
                 if (fallbackPrice) offerPrice = fallbackPrice[1];
            }
            if (!mrp) {
                 const fallbackMrp = scriptData.match(/"mrp":\s*([0-9]+)/) || scriptData.match(/"price":\s*([0-9]+)/g);
                 if (fallbackMrp && fallbackMrp.length > 1) {
                     let prices = fallbackMrp.map(p => parseInt(p.match(/[0-9]+/)[0]));
                     mrp = Math.max(...prices);
                 }
            }
            if (!discount && offerPrice && mrp) {
                 const calcDiscount = Math.round(((mrp - offerPrice) / mrp) * 100);
                 if (calcDiscount > 0) discount = calcDiscount;
            }
        }
        bestRawLink = targetUrl;
    }
    // 🌐 DEAL SITES HANDLER
    else {
        const pageText = $('body').text().replace(/\s+/g, ' '); 

        // 💰 1. SMART DOM-BASED PRICE & MRP EXTRACTION
        const domMrp = $('del, s, strike, [class*="strike"], [class*="old-price"]').first().text().replace(/[^0-9]/g, '');
        if (domMrp && domMrp.length > 1) mrp = domMrp;

        const priceMatch = pageText.match(/(?:offer price|deal price|price)[\s:]*₹?\s*([0-9,]+)/i) || 
                           pageText.match(/₹\s*([0-9,]+)\s*(?:instead of|only)/i) || 
                           pageText.match(/price of ₹\s*([0-9,]+)/i) ||
                           pageText.match(/₹\s*([0-9,]+)/i); 
                           
        if (priceMatch) offerPrice = priceMatch[1].replace(/,/g, '');

        if (!mrp) {
            const mrpMatch = pageText.match(/mrp[\s:]*₹?\s*([0-9,]+)/i) || pageText.match(/₹([0-9,]+)\s*\(Save/i) || pageText.match(/(?:original price|regular price|standard price)[\s:]*₹?\s*([0-9,]+)/i);
            if (mrpMatch) mrp = mrpMatch[1].replace(/,/g, '');
        }

        const discountMatch = pageText.match(/discount[\s:]*([0-9]+)\s*%/i) || pageText.match(/([0-9]+)\s*%\s*(?:off|discount)/i);
        if (discountMatch) {
            discount = discountMatch[1];
        } 
        else if (offerPrice && mrp && parseInt(mrp) > parseInt(offerPrice)) {
            discount = Math.round(((parseInt(mrp) - parseInt(offerPrice)) / parseInt(mrp)) * 100);
        }

        // 🧹 ENHANCED GARBAGE CHECKER
        const checkGarbage = (text) => {
            const lTxt = text.toLowerCase().trim();
            if (lTxt === "coupon" || lTxt === "coupons" || lTxt === "offer" || lTxt === "offers" || lTxt === "deal" || lTxt === "deals") return true;

            return lTxt.includes("telegram") || lTxt.includes("whatsapp") || 
                   lTxt.includes("download our app") || lTxt.includes("ios app") ||
                   lTxt.includes("shipping details") || lTxt.includes("credit/debit card") || 
                   lTxt.includes("visit the deal") || lTxt.includes("privacy policy") || 
                   lTxt.includes("terms of") || lTxt.includes("4-digit code") || 
                   lTxt.includes("verify your phone") || lTxt.includes("affiliate") || 
                   lTxt.includes("different seller") || lTxt === "description" || 
                   lTxt === "product description:" || lTxt === "product description" || 
                   lTxt.includes("price may vary") || lTxt.includes("participant in the") ||
                   lTxt.includes("live deals") || lTxt.includes("hotdeals") || 
                   lTxt.includes("quiz answers") || lTxt.includes("offer details") ||
                   lTxt.includes("redirects to amazon") || lTxt.includes("product prices and availability") ||
                   lTxt.includes("no control over") || lTxt.includes("makes no warranty") ||
                   lTxt.includes("coupons and deals are valid") || lTxt.includes("may get a commission") ||
                   lTxt.includes("reach out to us") || lTxt.includes("additional cost") ||
                   lTxt.includes("merchant's site") || lTxt.includes("subject to change") ||
                   lTxt.includes("disclaimer") || lTxt.includes("offertag - why us?") ||
                   lTxt.includes("other quicklinks") || lTxt.includes("disclosure") ||
                   lTxt.includes("deals new deals today") || lTxt.includes("great indian sale") ||
                   lTxt.includes("big billion days") || lTxt.includes("flipkart sale today") ||
                   lTxt.includes("copied") || lTxt.includes("coppied") || 
                   lTxt.includes("click to copy") || lTxt.includes("tap to copy") || 
                   lTxt.includes("show coupon") || lTxt.includes("copy code");
        };

        // ========================================================
        // 🛑 CUSTOM STOP ARRAY FOR 'EXTRA OFFERS' ONLY
        // Aap yahan site ke specific headings daal sakte hain. 
        // ========================================================
        const offerStopKeywords = [
            "offer details",       // DealsSpy cutoff
            "join us on",          // DealsMagnet cutoff
            "product description", // Another site cutoff
            "similar deals",       // Generic safety
            "related products",    // Generic safety
            "you may also like",
            "more deals"
        ];

        // 🔥 EXTRA OFFERS EXTRACTION (Independent Smart Cutoff)
        $('div, span, strong, b, p').each((i, el) => {
            if (extractedOffers.length >= 4) return false; // 🛑 4 offers milte hi loop completely break

            const txt = $(el).text().trim();
            const lowerTxt = txt.toLowerCase();

            // 🛑 CUSTOM STOP ENGINE: Agar keyword mila, toh array aage scan karna BURA band kar dega!
            const shouldStop = offerStopKeywords.some(keyword => lowerTxt.includes(keyword));
            if (shouldStop) {
                if (txt.length < 150) { // Ensures it's a heading, not a random long paragraph mentioning the word
                    return false; // 🔥 Cheerio me 'return false' loop ko hamesha ke liye rok deta hai
                }
            }

            if ((lowerTxt.includes("coupon") || lowerTxt.includes("bank cc") || lowerTxt.includes("hdfc") || lowerTxt.includes("sbi") || lowerTxt.includes("discount code") || lowerTxt.includes("cashback")) && txt.length > 8 && txt.length < 120) {
                if (!checkGarbage(txt)) { 
                    extractedOffers.push(txt);
                }
            }
        });

        // 🔥 DESCRIPTION EXTRACTION (Offers band hone ke baad bhi ye chalta rahega!)
        $('div[class*="desc"] p, div.description, p, ul li').each((i, el) => {
            let rawText = $(el).text();
            let text = rawText.replace(/\s+/g, ' ').trim(); 
            let lowerTxt = text.toLowerCase();

            // 🛑 DESCRIPTION STOP SIGNAL: Ye sirf tab rukega jab page ke ekdum aakhir ke sections aayenge
            if (
                (lowerTxt.includes("similar") && lowerTxt.includes("deal")) || 
                (lowerTxt.includes("related") && lowerTxt.includes("product")) ||
                (lowerTxt.includes("popular") && lowerTxt.includes("deal")) || 
                (lowerTxt.includes("trending") && lowerTxt.includes("now")) || 
                lowerTxt === "you may also like" || 
                lowerTxt === "leave a reply" ||
                lowerTxt === "comments" || 
                lowerTxt === "recent posts"
            ) {
                if (text.length < 100) {
                    return false; // 🔥 Break loop completely for description
                }
            }

            if (text.length > 35 && text.length < 600 && !checkGarbage(text)) {
                if (!description.includes(text)) description.push(text);
            }
        });
        
        if (description.length > 6) {
            description = description.slice(0, 6);
        }

        if (title) {
            title = title.replace(/OfferTag\s*[:\|\-]\s*/ig, '')
                         .replace(/Roobai\s*[:\|\-]\s*/ig, '')
                         .replace(/DealsMagnet\s*[:\|\-]\s*/ig, '')
                         .trim();
            if (title.includes('|')) title = title.split('|')[0].trim();
        }

        if (!title || title.toLowerCase().includes("deals") || title.toLowerCase().includes("similar") || title.length < 15) {
            let foundTitle = "";
            $('h1, h2, h3, div[class*="title"], div[class*="name"]').each((i, el) => {
                const txt = $(el).text().trim();
                const lTxt = txt.toLowerCase();
                const isJunkTitle = lTxt.includes("digit code") || lTxt.includes("verify") || lTxt.includes("similar") || lTxt.includes("roobai") || lTxt.includes("offertag") || lTxt.includes("deal of the day");
                
                if (txt.length > 15 && txt.length < 150 && !isJunkTitle) {
                    if (!foundTitle) foundTitle = txt; 
                }
            });
            if (foundTitle) title = foundTitle;
        }

        if (!image || image.includes("logo") || image.includes("favicon") || image.includes("avatar")) {
            $('img').each((i, el) => {
                const src = $(el).attr('src');
                if (src && (src.includes('cdn.') || src.includes('prd') || src.includes('product') || src.includes('deal') || src.includes('storage') || src.includes('uploads')) && !src.includes('logo') && !src.includes('icon') && !src.includes('avatar')) {
                    image = src.startsWith('//') ? 'https:' + src : (src.startsWith('/') ? new URL(targetUrl).origin + src : src);
                    return false; 
                }
            });
        }

        let dataCode = null;
        const buyButton = $('button.buy-button, button.BuyNowButton, [data-code], [data-url]');
        if (buyButton.length > 0) dataCode = buyButton.attr('data-code') || buyButton.attr('data-url');

        let directHrefLink = null;
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const btnText = $(el).text().toLowerCase();
            
            if (href && (
                href.includes('amazon.in') || href.includes('amzn.to') ||
                href.includes('flipkart.com') || href.includes('fkrt.it') || href.includes('fkrt.cc') ||
                href.includes('shopsy.in') || href.includes('myntra.com') || href.includes('myntr.it') ||
                href.includes('ajio.com') || href.includes('ajiio.in') || href.includes('earnkaro.com') || href.includes('linkredirect.in') ||
                href.includes('go.php') || // 🔥 FIX: Catching dealofthedayindia's go.php links
                btnText.includes('buy') || btnText.includes('shop now') || btnText.includes('get deal')
            )) {
                if (!href.includes('whatsapp.com') && !href.includes('telegram.me') && !href.includes('facebook.com')) {
                    if (!directHrefLink) directHrefLink = href; 
                }
            }
        });

        if (dataCode) {
            const urlObj = new URL(targetUrl);
            let apiUrl = `${urlObj.origin}/buy?${dataCode}`;
            const base64Match = dataCode.match(/utm_content=(aHR0c[a-zA-Z0-9+/=]+)/);
            
            if (base64Match) {
                 try {
                     const decodedString = Buffer.from(base64Match[1], 'base64').toString('utf-8');
                     const extractedLinkMatch = decodedString.match(/(https?:\/\/(?:www\.|dl\.)?(?:amazon\.in|amzn\.to|flipkart\.com|myntra\.com|ajio\.com|ajiio\.in)[\S]+)/i);
                     if (extractedLinkMatch) bestRawLink = extractedLinkMatch[1];
                 } catch (e) {}
            } 
            
            if (!bestRawLink) bestRawLink = apiUrl; 
        } else if (directHrefLink) {
            bestRawLink = directHrefLink.startsWith('/') ? new URL(targetUrl).origin + directHrefLink : directHrefLink;
        }

        // 🚀 UNIVERSAL REDIRECT EXPANDER 
        if (bestRawLink && (
            bestRawLink.includes('/buy?') || bestRawLink.includes('fkrt.it') || bestRawLink.includes('fkrt.cc') || 
            bestRawLink.includes('myntr.it') || bestRawLink.includes('linkredirect.in') || 
            bestRawLink.includes('earnkaro.com') || bestRawLink.includes('cuelinks.com') ||
            bestRawLink.includes('amzn.to') || bestRawLink.includes('ajiio.in')
        )) {
            let maxRedirects = 4;
            let currentUrl = bestRawLink;
            while (maxRedirects > 0) {
                try {
                    const redirectRes = await fetch(currentUrl, {
                        method: 'GET',
                        redirect: 'manual', 
                        headers: { "User-Agent": "Mozilla/5.0", "Referer": targetUrl }
                    });

                    if (redirectRes.status >= 300 && redirectRes.status < 400) {
                        const location = redirectRes.headers.get("location");
                        currentUrl = location.startsWith('/') ? new URL(currentUrl).origin + location : location;
                        bestRawLink = currentUrl;
                    } else {
                        const redirectHtml = await redirectRes.text();
                        const metaRefresh = redirectHtml.match(/url=(https?:\/\/[^"'>]+)/i);
                        if (metaRefresh) {
                            currentUrl = metaRefresh[1];
                            bestRawLink = currentUrl;
                        } else { break; }
                    }
                } catch (e) { break; }
                maxRedirects--;
            }
        }
    } 

    // 🧹 BULLETPROOF URL CLEANER
    
    // 🔥 NEW: Extract actual link from go.php (DealOfTheDayIndia)
    if (bestRawLink && bestRawLink.includes("go.php?")) {
        const goParts = bestRawLink.split('go.php?');
        if (goParts.length > 1) {
            // Decoding the URL part after 'go.php?'
            bestRawLink = decodeURIComponent(goParts[1]); 
        }
    }

    if (bestRawLink && (bestRawLink.includes("dl=http") || bestRawLink.includes("url=http") || bestRawLink.includes("dl=https"))) {
        try {
            const parsedUrl = new URL(bestRawLink);
            const secretParam = parsedUrl.searchParams.get("dl") || parsedUrl.searchParams.get("url");
            if (secretParam) bestRawLink = decodeURIComponent(secretParam);
        } catch(e) {}
    }
    
    if (bestRawLink) {
        bestRawLink = bestRawLink.replace(/[\\"'>)}]/g, '');

        try {
            const junkKeywords = ['pricehistory', 'dealsspy', 'dealsmagnet', 'offertag', 'roobai', 'earnkaro', 'linkredirect', 'affiliate'];
            const isJunkPath = (pathSegment) => junkKeywords.some(junk => pathSegment.toLowerCase().includes(junk));

            // AMAZON CLEANER
            if (bestRawLink.match(/amazon\.|amzn\./i)) {
                const lowerTarget = targetUrl.toLowerCase();
                if (!lowerTarget.includes("shopsy")) {
                   const asinMatch = bestRawLink.match(/\/(?:dp|gp\/product|exec\/obidos\/asin)\/([A-Z0-9]{10})/i);
                   if (asinMatch) {
                       bestRawLink = `https://www.amazon.in/dp/${asinMatch[1]}`;
                   } else {
                       const urlObj = new URL(bestRawLink);
                       let cleanPath = urlObj.pathname.split('/').filter(p => !p.includes('.com') && !p.includes('.in') && !isJunkPath(p)).join('/');
                       if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
                       ['tag', 'linkCode', 'camp', 'creative', 'ascsubtag', 'utm_source', 'utm_medium', 'utm_campaign', 'aff_id', 'click_id'].forEach(p => urlObj.searchParams.delete(p));
                       bestRawLink = `https://www.amazon.in${cleanPath}${urlObj.search}`;
                   }
                }
            }
            // FLIPKART CLEANER
            else if (bestRawLink.includes("flipkart.com")) {
                const urlObj = new URL(bestRawLink);
                const pid = urlObj.searchParams.get("pid");
                
                let cleanPathParts = urlObj.pathname.split('/');
                for (let j = 0; j < cleanPathParts.length; j++) {
                    if (isJunkPath(cleanPathParts[j])) {
                        cleanPathParts[j] = 'product'; 
                    }
                }
                let cleanPath = cleanPathParts.join('/');
                if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
                
                if (pid) {
                    bestRawLink = `https://www.flipkart.com${cleanPath}?pid=${pid}`;
                } else {
                    ['affid', 'cmpid', 'affExtParam1', 'affExtParam2', 'otracker', 'sid', 'pageUID'].forEach(p => urlObj.searchParams.delete(p));
                    bestRawLink = `https://www.flipkart.com${cleanPath}${urlObj.search}`;
                }
            }
            // MYNTRA / AJIO / OTHERS
            else {
                // 🔥 CLEANING LONG URLs (like Myntra/Ajio with tracking)
                bestRawLink = bestRawLink.replace(/\+/g, ' '); // Replacing + with spaces for cleaner names
                const urlObj = new URL(bestRawLink);
                let cleanPath = urlObj.pathname.split('/').filter(p => !isJunkPath(p)).join('/');
                if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

                // Stripping out ALL UTM, Affiliate and Tracking parameters
                // 🔥 Added all possible variations of affiliate and click IDs
                const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'aff_id', 'affid', 'click_id', 'clickid', 'af_siteid', 'product_name', 'campaign_id', 'af_click_lookback', 'host_internal', 'is_retargeting', 'pid', 'af_dp', 'af_xp', 'af_force_deeplink', 'deep_link_value', 'c', 'subid', 'subid1', 'subid2', 'affExtParam1', 'affExtParam2'];
                paramsToRemove.forEach(p => urlObj.searchParams.delete(p));
                
                bestRawLink = `${urlObj.origin}${cleanPath}${urlObj.search}`;
            }
        } catch (e) {
            console.error("URL Sanitizer Error:", e);
        }
    }

    // 🚫 10. UNSUPPORTED STORE BLOCKER (Cuelinks Restriction)
    // Kaise Enable Karein: Future mein agar kisi store ka campaign start ho jaye, 
    // toh bas us naam ko is list se delete kar dijiye.
    const blockedStores = ['meesho', 'swiggy', 'zomato', 'paytm', 'blinkit', 'zepto', 'dominos', 'bigbasket', 'jiomart'];
    const isBlocked = blockedStores.some(store => 
        (bestRawLink && bestRawLink.toLowerCase().includes(store)) || 
        (targetUrl && targetUrl.toLowerCase().includes(store)) || 
        (title && title.toLowerCase().includes(store))
    );

    if (isBlocked) {
        return NextResponse.json({ 
            success: false, 
            error: "Unsupported Store", 
            message: "This store is currently blocked as it's not supported by favylink." 
        }, { status: 200 }); // Status 200 isliye taaki webhook error fail na kare.
    }

    const uniqueOffers = [...new Set(extractedOffers)];

    return NextResponse.json({
      success: true,
      data: {
        title,
        image,
        offerPrice: offerPrice ? Number(offerPrice) : null,
        mrp: mrp ? Number(mrp) : null,
        discountPercentage: discount ? Number(discount) : null,
        extraOffers: uniqueOffers.length > 0 ? uniqueOffers : null,
        description: description, 
        bestRawLink: bestRawLink || "Link still hidden.",
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}