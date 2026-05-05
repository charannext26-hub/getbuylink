import mongoose from "mongoose";
import GlobalDeal from "@/lib/models/GlobalDeal";

// Yeh line Next.js ko bolti hai ki page ko cache mat karo, hamesha fresh data lao
export const dynamic = "force-dynamic"; 

export default async function TestDealsPage() {
  // Database connect karna
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  // Database se latest 20 deals nikalna (sabse nayi pehle)
  const deals = await GlobalDeal.find().sort({ createdAt: -1 }).limit(20);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🕵️‍♂️ Live Deal Monitor (Test)</h1>
          <p className="text-sm text-gray-500">Auto-refresh ke liye F5 dabayein</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <div key={deal._id.toString()} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              {/* Image Section */}
              <div className="h-48 bg-gray-200 relative">
                {deal.image ? (
                  <img 
                    src={deal.image} 
                    alt="Deal" 
                    className="w-full h-full object-contain p-2"
                    // Yahan se humne onError hata diya hai!
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>

              {/* Data Section */}
              <div className="p-4 space-y-2">
                <p className="text-xs font-bold text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded">
                  {deal.category || "No Category"}
                </p>
                <h2 className="font-semibold text-gray-800 line-clamp-2 leading-tight">
                  {deal.title || "No Title"}
                </h2>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-bold text-green-600">{deal.price}</span>
                  {deal.discountPercent && (
                    <span className="text-sm text-red-500 font-medium">{deal.discountPercent} Off</span>
                  )}
                </div>

                {deal.couponCode && (
                  <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-300 inline-block">
                    Coupon: <b>{deal.couponCode}</b>
                  </div>
                )}

                <div className="pt-3 border-t text-xs text-gray-500 break-all">
                  <b>Original Link:</b> <a href={deal.originalUrl} target="_blank" className="text-blue-500 hover:underline">{deal.originalUrl}</a>
                </div>
              </div>
            </div>
          ))}

          {deals.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500">
              Database ekdum khali hai bhai! Telegram se link bhejo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}