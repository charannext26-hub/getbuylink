import aws4 from 'aws4';
import * as cheerio from "cheerio"; // 🚨 Naya: Direct HTML parse karne ke liye

export async function fetchAmazonProductData(asin, productUrl) {
  console.log(`🚀 Firing Secure Request to Amazon PA-API for ASIN: ${asin}`);

  // 🚨 SMART FIX 1: Agar productUrl nahi aaya, toh ASIN se khud bana lo!
  const finalUrl = productUrl || `https://www.amazon.in/dp/${asin}`;

  try {
    // ==========================================
    // 🟢 PLAN A: Native AWS4 Signature (Official API)
    // ==========================================
    
    // Agar API keys missing hain, toh bewajah request mat bhejo, seedha Plan B par jao
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

    if (data.ItemsResult && data.ItemsResult.Items && data.ItemsResult.Items.length > 0) {
      const item = data.ItemsResult.Items[0];
      const priceObj = item.Offers?.Listings?.[0]?.Price;

      const exactPrice = priceObj?.DisplayAmount || "";
      const discount = priceObj?.Savings?.Percentage ? `${priceObj.Savings.Percentage}% OFF` : "";
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
    // ==========================================
    // 🟡 PLAN B: THE DIRECT SCRAPER (No Infinite Loops)
    // ==========================================
    console.log(`⚠️ Amazon API Failed (${error.message}). Switching to Direct Scraper Fallback...`);

    try {
      // 🚨 SMART FIX 2: getOgTags ko nahi bulana (loop rokne ke liye), yahi par chota sa fetch marenge
      const fallbackRes = await fetch(finalUrl, {
         headers: {
             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
             'Accept-Language': 'en-IN,en;q=0.9',
         }
      });
      
      const html = await fallbackRes.text();
      const $ = cheerio.load(html);

      // Amazon ki website se Title aur Image nikalne ki Ninja technique
      let title = $('#productTitle').text().trim() || $('meta[name="title"]').attr('content') || $('meta[property="og:title"]').attr('content') || "";
      let image = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src') || $('meta[property="og:image"]').attr('content') || "";

      if (title) {
          console.log("✅ Fallback Success! Scraper ne data nikal liya.");
          return {
            success: true,
            title: title.replace("Amazon.in: ", "").trim(),
            image: image,
            price: "Check Price on Amazon", // Amazon ki price HTML se nikalna bohot hard hai, isliye fallback text
            discountPercent: "", 
            category: "Other",
            source: "fallback_scraper"
          };
      } else {
          throw new Error("HTML Parse failed or Blocked by Amazon CAPTCHA");
      }

    } catch (fallbackError) {
      console.error("⛔ Fallback Fatal Error:", fallbackError.message);
      
      // ==========================================
      // 🔴 PLAN C: THE ULTIMATE SURVIVAL (Never Crash)
      // ==========================================
      // Agar Vercel IP poori tarah block ho jaye, tab bhi app crash na ho aur Product add ho jaye!
      return {
          success: true, 
          title: "Amazon Exclusive Product",
          image: "https://placehold.co/600x400/ff9900/white?text=Amazon+Product",
          price: "Best Price",
          discountPercent: "",
          category: "Other",
          source: "hard_fallback"
      };
    }
  }
}