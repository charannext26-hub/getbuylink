import aws4 from 'aws4';
import * as cheerio from "cheerio";

export async function fetchAmazonProductData(asin, productUrl) {
  console.log(`🚀 Firing Secure Request to Amazon PA-API for ASIN: ${asin}`);

  const finalUrl = productUrl || `https://www.amazon.in/dp/${asin}`;

  try {
    if (!process.env.AMAZON_ACCESS_KEY || !process.env.AMAZON_SECRET_KEY || !process.env.AMAZON_PARTNER_TAG) {
        throw new Error("Amazon PA-API Keys missing in .env");
    }

    const host = 'webservices.amazon.in';
    const region = 'eu-west-1'; 
    const path = '/paapi5/getitems';

    const payload = {
      ItemIds: [asin],
      ItemIdType: 'ASIN',
      PartnerTag: process.env.AMAZON_PARTNER_TAG,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.in',
      Resources: [
        'ItemInfo.Title', 
        'Images.Primary.Large', 
        'Offers.Listings.Price', 
        'Offers.Listings.SavingBasis',
        'Offers.Summaries.LowestPrice',
        'ItemInfo.Classifications'
      ]
    };

    const opts = {
      host: host,
      path: path,
      service: 'ProductAdvertisingAPI',
      region: region,
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'amz-1.0',
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems'
      }
    };

    aws4.sign(opts, {
      accessKeyId: process.env.AMAZON_ACCESS_KEY,
      secretAccessKey: process.env.AMAZON_SECRET_KEY
    });

    const response = await fetch(`https://${host}${path}`, opts);
    const data = await response.json();

    // 🛑 TERMINAL LOG BAND KAR DIYA (Production Ready)
    // console.log("📦 RAW AMAZON PA-API RESPONSE:", JSON.stringify(data, null, 2));

    if (data.ItemsResult && data.ItemsResult.Items && data.ItemsResult.Items.length > 0) {
      const item = data.ItemsResult.Items[0];
      
      let exactPrice = "";
      let discount = "";

      if (item.Offers && item.Offers.Listings && item.Offers.Listings.length > 0) {
          const priceObj = item.Offers.Listings[0].Price;
          exactPrice = priceObj?.DisplayAmount || "";
          discount = item.Offers.Listings[0].SavingBasis ? `${item.Offers.Listings[0].Price?.Savings?.Percentage || 0}% OFF` : "";
      } else if (item.Offers && item.Offers.Summaries && item.Offers.Summaries.length > 0) {
          exactPrice = item.Offers.Summaries[0].LowestPrice?.DisplayAmount || "";
      }

      const category = item.ItemInfo?.Classifications?.ProductGroup?.DisplayValue || "Other";

      return {
        success: true,
        title: item.ItemInfo?.Title?.DisplayValue || "Amazon Exclusive Deal",
        image: item.Images?.Primary?.Large?.URL || "",
        price: exactPrice,
        discountPercent: discount,
        category: category,
        source: "api"
      };
    } else {
      throw new Error("Item not found in API response");
    }

  } catch (error) {
    console.log(`⚠️ Amazon API Failed (${error.message}). Switching to Direct Scraper Fallback...`);

    try {
      const fallbackRes = await fetch(finalUrl, {
         headers: {
             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
             'Accept-Language': 'en-IN,en;q=0.9',
         }
      });
      
      const html = await fallbackRes.text();
      const $ = cheerio.load(html);

      let title = $('#productTitle').text().trim() || $('meta[name="title"]').attr('content') || $('meta[property="og:title"]').attr('content') || "";
      let image = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src') || $('meta[property="og:image"]').attr('content') || "";
      
      let fallbackPrice = $('span.a-price-whole').first().text().replace(/[.,]/g, '').trim();
      if (!fallbackPrice) fallbackPrice = $('span.a-offscreen').first().text().replace(/[^\d]/g, '').trim();
      if (fallbackPrice) fallbackPrice = `₹${fallbackPrice}`;

      if (title) {
          console.log("✅ Fallback Success! Scraper ne data nikal liya.");
          return {
            success: true,
            title: title.replace("Amazon.in: ", "").trim(),
            image: image,
            price: fallbackPrice || "",
            discountPercent: "", 
            category: "Other",
            source: "fallback_scraper"
          };
      } else {
          throw new Error("HTML Parse failed or Blocked by Amazon CAPTCHA");
      }

    } catch (fallbackError) {
      return {
          success: true, 
          title: "Amazon Exclusive Product",
          image: "https://placehold.co/600x400/ff9900/white?text=Amazon+Product",
          price: "",
          discountPercent: "",
          category: "Other",
          source: "hard_fallback"
      };
    }
  }
}