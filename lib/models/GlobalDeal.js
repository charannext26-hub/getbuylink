import mongoose from 'mongoose';

const GlobalDealSchema = new mongoose.Schema({
  creatorId: { type: String, required: true }, 
  source: { type: String, default: "creator" }, 
  batchId: { type: String, default: "" }, 
  linkType: { type: String, enum: ["platform", "own"], default: "platform" },
  
  originalUrl: { type: String, required: true }, 
  expandedUrl: { type: String }, // Hamesha lamba link save hoga!
  store: { type: String, default: "Unknown" },
  shortCode: { type: String, default: "" },
  
  title: { type: String, required: true }, 
  image: { type: String, required: true }, 
  
  price: { type: String, default: "" },
  discountPercent: { type: String, default: "" }, 
  couponCode: { type: String, default: "" }, 
  category: { type: String, default: "Other" }, 
  collectionName: { type: String, default: "" }, 
  
  // 🚨 YAHAN JAGAH BANAYI HAI HUMNE ADVANCED DETAILS KI 🚨
  videoUrl: { type: String, default: "" }, 
  saleEndTime: { type: Date, default: null }, // 🚨 Timer ke liye jagah!
  
  isExpired: { type: Boolean, default: false }
}, { timestamps: true });

const GlobalDeal = mongoose.models.GlobalDeal || mongoose.model('GlobalDeal', GlobalDealSchema);
export default GlobalDeal;