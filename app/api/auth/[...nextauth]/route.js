import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials"; 
import User from "@/lib/models/User";
import bcrypt from "bcryptjs"; 
// 🚨 NAYA: Mongoose ki jagah aapki apni optimized DB file import ki hai
import connectToDatabase from "@/lib/mongodb"; 

export const authOptions = {
  providers: [
    // --- 1. GOOGLE LOGIN ---
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // --- 2. EMAIL & PASSWORD LOGIN (Credentials) ---
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 🚨 NAYA: Optimized connection use kiya
        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email });

        // Agar email nahi mila
        if (!user) throw new Error("No account found with this email!");
        // Agar Google se signup kiya tha (password nahi hai)
        if (!user.password) throw new Error("You previously signed up with Google. Please use 'Continue with Google'.");
        
        // Password check karein
        const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordMatch) throw new Error("Incorrect Password!");

        // Sab theek hai toh data bhejo
        return { id: user._id.toString(), name: user.name, email: user.email };
      }
    })
  ],
  // 🚨 SECURITY & SESSION SETTINGS 
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // Yeh function har baar chalega jab koi login karega
    async signIn({ user, account }) {
      if (account.provider === "google") {
        try {
          // 🚨 NAYA: Optimized connection use kiya
          await connectToDatabase();

          const userExists = await User.findOne({ email: user.email });

          if (!userExists) {
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              // Note: Username abhi khali rahega
            });
            console.log("Naya Creator Database mein Save ho gaya! 🎉");
          }
          
          return true; // Login Successful!
        } catch (error) {
          console.log("Database mein save karte waqt error aaya: ", error);
          return false; // Agar error aaye toh login cancel kar dein
        }
      }
      
      // Credentials login ko aage badhne ki permission
      return true;
    },

   // 🚨 THE FIX: Token aur Session mein Username daalne ka logic
    async jwt({ token, user, trigger }) { 
      // 1. Jab pehli baar login hoga
      if (user) {
        token.id = user.id;
        
        // 🚨 NAYA: Optimized connection use kiya
        await connectToDatabase();
        const dbUser = await User.findOne({ email: user.email });
        token.username = dbUser?.username || null;
      }

      // 2. Jab Navbar/Frontend se 'update()' call ho 
      if (trigger === "update") {
        // 🚨 NAYA: Optimized connection use kiya
        await connectToDatabase();
        const dbUser = await User.findOne({ email: token.email });
        token.username = dbUser?.username || null; 
      }

      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username; 
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', // Hamara custom login page
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };