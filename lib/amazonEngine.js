import aws4 from 'aws4';
import { getOgTags } from "@/lib/scraper"; 

export async function fetchAmazonProductData(asin, productUrl) {
  console.log(`🚀 Firing Secure Request to Amazon PA-API for ASIN: ${asin}`);

  try {
    // ==========================================
    // 🟢 PLAN A: Native AWS4 Signature (No Crash)
    // ==========================================
    const host = 'webservices.amazon.in';
    const region = 'eu-west-1'; // 🚨 Amazon India ka correct API region
    const path = '/paapi5/getitems';

    // 🚨 Humein Amazon se kya kya chahiye (Title, Image, Price, Category)
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

    // 🚨 Request ko secure banaya
    aws4.sign(opts, {
      accessKeyId: process.env.AMAZON_ACCESS_KEY,
      secretAccessKey: process.env.AMAZON_SECRET_KEY
    });

    const response = await fetch(`https://${host}${path}`, opts);
    const data = await response.json();

    if (data.ItemsResult && data.ItemsResult.Items && data.ItemsResult.Items.length > 0) {
      const item = data.ItemsResult.Items[0];
      const priceObj = item.Offers?.Listings?.[0]?.Price;

      // 🚨 Data Extract kiya (Exact Price, % Off, aur Category)
      const exactPrice = priceObj?.DisplayAmount || "";
      const discount = priceObj?.Savings?.Percentage ? `${priceObj.Savings.Percentage}% OFF` : "";
      const category = item.ItemInfo?.Classifications?.ProductGroup?.DisplayValue || "Other";

      console.log(`✅ Amazon API Success! Price: ${exactPrice}, Discount: ${discount}`);

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
    // 🟡 PLAN B: THE SMART FALLBACK (Scraper)
    // ==========================================
    console.log(`⚠️ Amazon API Failed (${error.message}). Switching to Smart Fallback...`);

    if (!productUrl) {
      console.log("❌ Fallback ke liye URL nahi bheja gaya!");
      return { success: false };
    }

    try {
      console.log(`🕵️‍♂️ Scraper running for fallback on: ${productUrl}`);
      const scrapedData = await getOgTags(productUrl);

      if (scrapedData.success) {
        console.log("✅ Fallback Success! Scraper ne data nikal liya.");
        return {
          success: true,
          title: scrapedData.title || "Amazon Mega Deal",
          image: scrapedData.image || "https://placehold.co/600x400/indigo/white?text=Amazon+Deal",
          price: "Best Price", 
          discountPercent: "", // Scraper usually discount nahi la pata
          category: "Other",
          source: "scraper"
        };
      } else {
        throw new Error("Scraper bhi data nahi nikal paya");
      }
    } catch (fallbackError) {
      console.error("⛔ Fallback Fatal Error:", fallbackError.message);
      return { success: false };
    }
  }
}