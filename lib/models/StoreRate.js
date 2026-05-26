import mongoose from "mongoose";

const StoreRateSchema = new mongoose.Schema({
  campaignId: { type: String, unique: true },
  name: String,
  domain: String,
  image: String,
  payout: String,
  payout_type: String,
  payout_categories: Array,
  countries: Array,
  important_info_html: String,
  conversion_flow: String,
  cookie_duration: String,
  isManual: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false } // 🚨 NAYA: Store hide karne ke liye
});

export default mongoose.models.StoreRate || mongoose.model("StoreRate", StoreRateSchema);