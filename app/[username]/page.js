import mongoose from "mongoose";
import User from "@/lib/models/User";
import BioPageClient from "./BioPageClient";

export const revalidate = 60;

// 🌟 1. ASYNC METADATA ENGINE (Yahan await zaroori hai Next.js SEO ke liye)
export async function generateMetadata({ params }) {
  try {
    const resolvedParams = await params;
    const username = resolvedParams?.username?.toLowerCase()?.trim();
    
    if (!username) return { title: "FavyLink Storefront" };

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 1. .select() me sirf 'image' mangwayein
    const creator = await User.findOne({ username }).select("name bio image username").lean();

    if (!creator) {
      return { 
        title: `${username}'s Store | FavyLink`,
        description: "Monetize your audience, share premium product links, and track your earnings with FavyLink."
      };
    }

    const title = `${creator.name || creator.username}'s Store | FavyLink`;
    const description = creator.bio || "Shop my favorite products, exclusive coupons, and live deals!";
    
    // 2. Yahan creator.image set karein
    const imageUrl = creator.image && creator.image.startsWith("http") 
      ? creator.image 
      : "https://favylink.com/logo-avy-black.png";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://favylink.com/${creator.username}`,
        siteName: "FavyLink Ecosystem",
        images: [{ url: imageUrl, width: 1200, height: 630, alt: `${creator.name}'s Store` }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (err) {
    return { title: "FavyLink Storefront" };
  }
}

// 🚀 2. CLIENT BRIDGE (Bina await kiye direct Promise bhej rahe hain)
export default function CreatorPageWrapper({ params }) {
  return <BioPageClient params={params} />;
}