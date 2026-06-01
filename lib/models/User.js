import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // 1. Core Profile
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true, sparse: true }, 
  image: { type: String },
  
  // 🚨 NAYA: Password for Email/Password Login
  password: { type: String },

  // 2. Personalization
  bio: { type: String, default: "" },
  mobileNumber: { type: String, default: "" }, 
  bioTheme: { type: String, default: "light" }, 
  banners: { type: Array, default: [] }, 
  socialHandles: { type: Array, default: [] },
  nicheCategories: { type: [String], default: [] }, 

  // 3. Auto-Post Control 
  autodeal_active: { type: Boolean, default: false }, 
  autoDealCategories: { type: [String], default: [] }, 
  amazonTag: { type: String, default: "" }, 
  cuelinksSubId: { type: String }, 

  // 3.5 Sales Booster 
  salesBoosterActive: { type: Boolean, default: false },

  // 4. Earnings
  creatorEarnings: { type: Number, default: 0 }, 
  platformEarnings: { type: Number, default: 0 },

  // 5. Security & Team Access
  role: { 
    type: String, 
    enum: ["creator", "admin", "moderator"], 
    default: "creator" 
  },

  // 👇 NAYA ADD KIYA: 6. Email Verification System 👇
  isVerified: { type: Boolean, default: false },
  verifyToken: { type: String },
  verifyTokenExpiry: { type: Date }
  
}, { 
  timestamps: true 
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;