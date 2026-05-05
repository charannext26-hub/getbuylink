import mongoose from 'mongoose';

const LinkSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  
  // Link ka type: 'single', 'collection', ya 'video'
  type: { type: String, default: 'single' }, 
  
  title: { type: String, required: true },
  originalUrl: { type: String, required: true },
  
  // Cuelinks API se convert hone ke baad wala link (agar platform se generate hua hai)
  cuelinkUrl: { type: String }, 
  
  image: { type: String }, 
  price: { type: String },
  category: { type: String, default: 'Uncategorized' }, // Tab 4 ke liye
  
  // Advanced Features (Jo aapne plan kiye hain)
  videoUrl: { type: String }, // Agar creator reel/youtube link dale
  couponCode: { type: String }, // Half-hidden coupon ke liye
  timerEndDate: { type: Date }, // FOMO timer ke liye
  
  // Tab 2 (Most Buy) ki ranking ke liye click tracker
  clicks: { type: Number, default: 0 },
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Link = mongoose.models.Link || mongoose.model('Link', LinkSchema);
export default Link;