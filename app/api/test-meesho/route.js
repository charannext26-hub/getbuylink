import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ success: false, error: "URL missing" });

    // STEP 1: Product ID nikal kar Clean URL banana (Ye step WAF bypass ke chances badha deta hai)
    let productId = null;
    const match = url.match(/\/p\/([a-zA-Z0-9]+)/i);
    if (match && match[1]) productId = match[1];
    else {
      const parts = url.split('/');
      productId = parts[parts.length - 1].split('?')[0]; 
    }

    const cleanProductUrl = `https://www.meesho.com/s/p/${productId}`;
    console.log("🧼 Target URL:", cleanProductUrl);

    let title = "";
    let image = "";
    let methodUsed = "";

    // ==========================================
    // 🛡️ THE API DELEGATOR ENGINE
    // ==========================================

    // METHOD 1: DUB.CO METATAGS API (Free & Fast)
    console.log("▶️ Trying Dub.co API...");
    try {
      const dubRes = await fetch(`https://api.dub.co/metatags?url=${encodeURIComponent(cleanProductUrl)}`);
      if (dubRes.ok) {
        const dubData = await dubRes.json();
        // Check karenge ki kahin WAF block ka title toh nahi aa gaya
        if (dubData.title && !dubData.title.toLowerCase().includes("just a moment")) {
          title = dubData.title;
          image = dubData.image;
          methodUsed = "Dub.co API";
          console.log("✅ Dub.co Success!");
        }
      }
    } catch (e) {
      console.log("❌ Dub.co Failed");
    }

    // METHOD 2: MICROLINK API (The Heavyweight Fallback - 100% Free for basic meta)
    if (!title || !image) {
      console.log("▶️ Trying Microlink API...");
      try {
        const microRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(cleanProductUrl)}`);
        if (microRes.ok) {
          const microData = await microRes.json();
          if (microData.data && microData.data.title && !microData.data.title.toLowerCase().includes("just a moment")) {
            title = microData.data.title;
            // Microlink image ko object mein deta hai
            image = microData.data.image?.url || microData.data.logo?.url || "";
            methodUsed = "Microlink API";
            console.log("✅ Microlink Success!");
          }
        }
      } catch (e) {
         console.log("❌ Microlink Failed");
      }
    }

    // FAILSAFE
    if (!title || !image) {
      return NextResponse.json({ 
        success: false, 
        error: "Meesho ka IP block bohot strict hai. Aap product ka Title/Image manually add kar sakte hain.",
        note: "Data fetch APIs bhi WAF se block ho gayi."
      });
    }

    // FINAL CLEANUP
    title = title.replace(/\|?\s*Meesho\s*/i, '').replace(/Buy online.*/i, '').trim();

    // 🚀 SUCCESS!
    return NextResponse.json({ 
      success: true, 
      method: `Delegated to ${methodUsed}`,
      data: {
        originalUrl: url,
        cleanUrl: cleanProductUrl,
        productId: productId,
        title: title,
        image: image
      }
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}