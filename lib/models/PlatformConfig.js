import mongoose from 'mongoose';

const PlatformConfigSchema = new mongoose.Schema({
  configId: { type: String, default: "master_config", unique: true },

  topNotice: {
    isActive: { type: Boolean, default: false },
    text: { type: String, default: "" },
    linkUrl: { type: String, default: "" },
    bgColor: { type: String, default: "bg-indigo-600" } 
  },

  globalPopup: {
    isActive: { type: Boolean, default: false },
    imageUrl: { type: String, default: "" },
    linkUrl: { type: String, default: "" }
  },

  banners: [{
    imageUrl: { type: String, required: true },
    linkUrl: { type: String, default: "#" }
  }],

  storeSales: [{
    storeCode: { type: String, required: true },
    storeName: { type: String, required: true },
    statusText: { type: String, required: true },
    statusType: { type: String, default: "upcoming" }, 
    linkUrl: { type: String, default: "#" }
  }],

  topDealSections: [{
    sectionId: { type: String, required: true }, 
    storeName: { type: String, required: true }, 
    sectionTitle: { type: String, required: true }, 
    isActive: { type: Boolean, default: true }, 
    sortOrder: { type: Number, default: 0 }, 
    deals: [{
      originalUrl: { type: String, default: "" }, 
      expandedUrl: { type: String, default: "" }, 
      linkUrl: { type: String, default: "#" },
      store: { type: String, default: "" },
      imageUrl: { type: String, required: true },
      title: { type: String, required: true },
      commissionText: { type: String, default: "Earn 10%" },
      price: { type: String, default: "" },
      discountPercent: { type: String, default: "" },
      coupon: { type: String, default: "" },
      timer: { type: String, default: "" } 
    }]
  }],

  extraSections: [{
    sectionId: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true }, 
    isActive: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 }
  }],

  // 🚨 NAYA 1: VIP Store Rates Slider Control
  vipStoreRates: {
    isActive: { type: Boolean, default: true } // Default ON rakha hai
  },

  // 🚨 NAYA 2: YouTube Tutorial Banners
  youtubeBanners: {
    isActive: { type: Boolean, default: true },
    videos: [{
      title: { type: String, required: true },
      videoUrl: { type: String, required: true },
      thumbnailUrl: { type: String, required: true }
    }]
  }

}, { timestamps: true });

const PlatformConfig = mongoose.models.PlatformConfig || mongoose.model('PlatformConfig', PlatformConfigSchema);

export default PlatformConfig;