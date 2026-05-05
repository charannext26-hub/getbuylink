import mongoose from 'mongoose';

// 🚨 NAYA: Single Transaction Schema (Har order ki kundli yahan save hogi)
const TransactionSchema = new mongoose.Schema({
  transactionId: { type: String },
  orderId: { type: String, required: true }, // Cuelinks Order ID (Duplicate check karne ke liye)
  productName: { type: String, default: "Unknown Product" }, // Ex: "TOKAR Men Sports Sandals"
  category: { type: String, default: "Other" }, // Ex: "MensCnFFootwear"
  transactionDate: { type: Date }, // Sale kab hui
  channelId: { type: String }, // Future-proof: Agar channel change ho
  saleAmount: { type: Number, default: 0 }, // Ex: 291.0
  commission: { type: Number, default: 0 }, // Creator ka final payout
  status: { type: String, default: "pending" } // pending, approved, declined
});

const LinkPerformanceSchema = new mongoose.Schema({
  // Pehchaan (Identity)
  creatorId: { type: String, required: true },
  shortCode: { type: String },
  subId: { type: String, default: "" }, 
  affiliateUrl: { type: String, required: true }, // The final Cuelinks or Own link
  originalUrl: { type: String }, // Reference ke liye
  title: { type: String, required: true }, // Jaise "Puma Shoes"
  store: { type: String, default: "Unknown" },
  source: { type: String, enum: ["telegram", "manual","auto-post-share"], required: true },
  linkType: { type: String, enum: ["platform", "own"], default: "platform" },
  globalDealId: { type: String, default: "" }, 

  // Basic Metrics (Click catcher update karega)
  clicks: { type: Number, default: 0 },
  
  // Advanced Aggregate Metrics (Overall Dashboard ke liye fast padhne ke liye)
  sales: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  totalOrderValue: { type: Number, default: 0 }, 
  
  // Detailed Earnings
  earnings: {
    pending: { type: Number, default: 0 },
    confirmed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 }
  },

  // 🚨 NAYA: Detailed Order History (Analytics Page ki jaan)
  transactions: [TransactionSchema],

  lastClickedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// 🚨 MASTERSTROKE: Yeh index database ko fast banayega aur duplicate rows banne se rokega
LinkPerformanceSchema.index({ creatorId: 1, affiliateUrl: 1 }, { unique: true });

const LinkPerformance = mongoose.models.LinkPerformance || mongoose.model('LinkPerformance', LinkPerformanceSchema);
export default LinkPerformance;