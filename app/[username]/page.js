import mongoose from "mongoose";
import User from "@/lib/models/User";
import BioPageClient from "./BioPageClient";

// 🌟 1. SERVER-SIDE SEO & OPENGRAPH ENGINE (WhatsApp / Telegram / Google)
export async function generateMetadata({ params }) {
  try {
    const username = params?.username?.toLowerCase()?.trim();
    if (!username) return { title: "FavyLink Storefront" };

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // DB se fast creator ka naam aur image fetch karo
    const creator = await User.findOne({ username }).select("name bio profileImage username").lean();

    if (!creator) {
      return { title: "Creator Not Found | FavyLink" };
    }

    const title = `${creator.name || creator.username}'s Store | FavyLink`;
    const description = creator.bio || "Shop my favorite tech review products, exclusive coupons, and live deals!";
    const imageUrl = creator.profileImage || "https://favylink.com/default-banner.jpg";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://favylink.com/${creator.username}`,
        siteName: "FavyLink Ecosystem",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${creator.name}'s Profile`,
          },
        ],
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (err) {
    return { title: "FavyLink Creator Store" };
  }
}

// 🚀 2. CLIENT RENDER BRIDGE (Ye aapke 1700 line ke code ko waisa hi load karega)
export default function CreatorPageWrapper({ params }) {
  return <BioPageClient params={params} />;
}