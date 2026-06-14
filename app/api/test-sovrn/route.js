import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.SOVRN_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "API Key is missing in .env" }, { status: 400 });
    }

    const targetUrl = encodeURIComponent("https://favylink.com/deals");
    const apiUrl = `https://shopping-gallery.prd-commerce.sovrnservices.com/ai-orchestration/products?apiKey=${apiKey}&pageUrl=${targetUrl}`;

    // 🚀 BUG FIXED: Documentation ke hisaab se exact camelCase parameters use kiye hain
    const payload = {
      content: "Looking for the best deals, heavy discounts, offers on electronics, smartphones, fashion, home appliances, and shoes in India.", 
      numProducts: 15,          // Sahi spelling
      market: "inr_en",         // Indian Market
      includeMerchants: [       // Sahi spelling (Capital M)
        "185",     // Amazon
        "36770",   // Flipkart
        "24957",   // Myntra
        "86492",   // Ajio
        "199595",  // Dot & Key
        "94452"    // TataCliq
      ]
    };

    console.log("➡️ Fetching Indian Deals from Sovrn...");

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // 🛠️ MAGIC: Yahan hum raw URL aur clean data nikal kar dikhayenge
    let cleanProducts = [];
    if (data.products && data.products.length > 0) {
        cleanProducts = data.products.map(prod => {
            // Agar raw url available nahi hai toh deepLink se 'u=' param nikalenge
            let rawUrl = prod.url;
            if (!rawUrl && prod.deepLink) {
                try {
                    const urlObj = new URL(prod.deepLink);
                    rawUrl = decodeURIComponent(urlObj.searchParams.get('u') || prod.deepLink);
                } catch(e) {}
            }

            return {
                store: prod.merchant?.name || "Unknown",
                title: prod.name,
                price: prod.salePrice,
                mrp: prod.retailPrice,
                discountPercent: prod.discountRate,
                rawAffiliateLink: rawUrl, // 👈 Ye raha aapka Cuelinks ke liye Raw Link!
                image: prod.imageURL
            };
        });
    }

    return NextResponse.json({
        success: true,
        message: "Indian Deals Fetched Successfully",
        totalReturned: cleanProducts.length,
        deals: cleanProducts, // Clean kiya hua data
        rawData: data // Sovrn ka original kachha data
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Sovrn Test Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}