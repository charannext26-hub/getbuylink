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
  // 🚨 NAYE FIELDS ADD KIYE HAIN
  important_info_html: String,
  conversion_flow: String,
  cookie_duration: String,
});

export default mongoose.models.StoreRate || mongoose.model("StoreRate", StoreRateSchema);