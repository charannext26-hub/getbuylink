import Link from 'next/link';
import CompactFooter from '../../components/CompactFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      {/* ========================================== */}
      {/* NAVBAR FOR LEGAL PAGES */}
      {/* ========================================== */}
      <nav className="w-full bg-white border-b border-slate-200 z-50 sticky top-0 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Flat PNG Logo Only (No text, no box) */}
          <Link href="/" className="flex items-center cursor-pointer">
            <img 
              src="https://i.postimg.cc/gcvJRMnS/favylink-text-logo-avy-black-(raw)-png.png" 
              className="h-8 sm:h-10 w-auto object-contain" 
              alt="FavyLink Logo" 
            />
          </Link>

          {/* Navigation Buttons (Home & Dashboard) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Left Arrow - Home */}
            <Link href="/" className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-blue-50 px-3 sm:px-4 py-2 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span className="hidden sm:inline">Home</span>
            </Link>
            
            {/* Right Arrow - Dashboard */}
            <Link href="/creators" className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white transition-colors bg-blue-600 hover:bg-blue-700 px-3 sm:px-4 py-2 rounded-full shadow-md shadow-blue-500/20">
              <span>Dashboard</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>

        </div>
      </nav>

      {/* ========================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================== */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 sm:py-16">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 sm:p-12">
          
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Terms & Conditions</h1>
          <p className="text-slate-500 font-medium mb-8 pb-8 border-b border-slate-100">Effective Date: [Current Date]</p>

          <div className="space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
            
            <p>
              Welcome to FavyLink (favylink.com). By accessing, registering, or utilizing our platform, you agree to be bound by the following comprehensive Terms & Conditions. This document serves as a legally binding agreement between you (the "Creator," "Influencer," or "User") and FavyLink. Please read these terms carefully before using our services.
            </p>

            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Account Registration, Eligibility & Usage Restrictions</h2>
              <p className="mb-3">To utilize FavyLink's storefront and affiliate features, you must create an account by providing accurate, verifiable, and current information, including your full legal name, active email address, mobile number, and primary social media handles.</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li><strong className="text-slate-800">Eligibility:</strong> You must be at least 18 years of age to participate in the FavyLink monetization program.</li>
                <li><strong className="text-slate-800">Content Restrictions:</strong> Your storefront must comply with global community standards. Creators are strictly prohibited from utilizing FavyLink to display, promote, or link to spam, illegal substances, weapons, adult/explicit content, hate speech, or any material that infringes upon third-party intellectual property rights.</li>
                <li><strong className="text-slate-800">Account Security:</strong> You are solely responsible for maintaining the confidentiality of your login credentials. FavyLink will not be liable for any loss arising from unauthorized access to your account.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. The FavyLink 100% Free Guarantee</h2>
              <p className="mb-3">FavyLink is committed to empowering creators without upfront financial burdens. We operate as a completely free platform for our users.</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li>We do not charge setup fees, monthly subscription fees, or maintenance charges.</li>
                <li>We do not deduct any percentage cut or commission fee from the approved earnings generated through your storefront. You are entitled to 100% of the approved affiliate commissions you generate.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Cost Per Sale (CPS) Campaigns & Commission Validation</h2>
              <p className="mb-3">FavyLink operates its monetization infrastructure primarily on a Cost Per Sale (CPS) model in partnership with global retailers (e.g., Amazon, Myntra, Flipkart).</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li><strong className="text-slate-800">Generation of Commission:</strong> Commissions are strictly tracked and generated only when a follower successfully completes a qualifying purchase using the affiliate links provided on your FavyLink storefront. We do not pay for mere clicks or impressions.</li>
                <li><strong className="text-slate-800">Validation Window:</strong> All generated sales initially reflect as "Pending" in your dashboard. These are subject to a mandatory validation period of 30 to 60 days by the respective partner brands. This holding period is legally required by retailers to ensure the product is successfully "Delivered" and the customer's return/exchange window has fully expired.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Payout Terms, Thresholds, and Processing</h2>
              <p className="mb-3">We pride ourselves on offering a flexible, creator-first payout system without rigid monthly payout cycles.</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li><strong className="text-slate-800">Minimum Withdrawal Threshold:</strong> To initiate a payout, your "Approved" earnings balance must reach the minimum threshold of ₹250 (Note: This threshold is subject to change at FavyLink's discretion in the future).</li>
                <li><strong className="text-slate-800">Withdrawal Initiation:</strong> Once the threshold is met, you may manually request a withdrawal at any time directly through your creator dashboard by inputting your preferred payment details.</li>
                <li><strong className="text-slate-800">Processing Timeline:</strong> Upon receiving a withdrawal request, our compliance team will verify the earnings. Approved funds will be transferred to your selected payment method within 2 to 3 working days.</li>
                <li><strong className="text-slate-800">Supported Payment Methods:</strong> FavyLink currently supports direct Bank Transfers (NEFT/IMPS) and UPI transfers. Future updates may introduce additional wallet services (such as Paytm).</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Commission Reversals (Refunds & Cancellations)</h2>
              <p className="mb-3">FavyLink’s payout structure is strictly tied to successful, finalized sales.</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li>If a customer purchases a product via your link but subsequently cancels the order before delivery, or returns the product within the retailer's specified return window, the pending commission for that specific transaction will be immediately reversed.</li>
                <li>This deduction will reflect dynamically in your FavyLink dashboard to ensure transparency.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Taxes and Processing Fees</h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li><strong className="text-slate-800">Tax Liabilities:</strong> Creators act as independent contractors. You are solely responsible for calculating, reporting, and remitting any applicable income taxes, GST, or other local taxes applied to your earnings in your country of residence.</li>
                <li><strong className="text-slate-800">Transaction Fees:</strong> FavyLink absorbs its own operational costs and does not charge any internal processing fees for withdrawing your money. However, please note that your specific bank or payment provider may apply standard transaction or clearance charges, which are beyond our control.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Anti-Fraud, Spam & Account Termination Policy</h2>
              <p className="mb-3">FavyLink maintains a strict zero-tolerance policy towards fraudulent activities, system abuse, and artificial inflation of statistics.</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li><strong className="text-slate-800">Prohibited Activities:</strong> Actions such as using automated bots for clicks, participating in click-exchange farms, generating fake orders, or self-purchasing to unlawfully exploit affiliate commissions are explicitly banned.</li>
                <li><strong className="text-slate-800">Consequences of Fraud:</strong> FavyLink reserves the absolute right to suspend, freeze, or permanently terminate any account suspected of fraudulent activity without any prior notice or warning.</li>
                <li><strong className="text-slate-800">Forfeiture of Funds:</strong> In the event of account termination due to fraud or policy violation, all pending and approved earnings associated with the offending account will be permanently forfeited to cover damages and retailer chargebacks.</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">8. Smart Redirection & Breakout Technology</h2>
              <p className="mb-3">To maximize your conversion rates and provide a flawless user experience, FavyLink utilizes advanced breakout technology.</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li>When a follower clicks a link within an external app's internal browser (such as the Instagram or Facebook in-app browser), our technology forces the link to open in the user’s native default browser (Chrome/Safari) or directly within the respective retailer's dedicated shopping app (e.g., Myntra App).</li>
                <li>This prevents login drops and ensures accurate tracking of your affiliate sales.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">9. Storefront Rules & Content Integrity (Strictly Enforced)</h2>
              <p className="mb-3">To maintain the highest level of trust with your audience and our retail partners, all creators must represent products, deals, and discounts accurately on their storefronts. The following deceptive practices are strictly prohibited:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li><strong className="text-slate-800">No Fake Coupons:</strong> Displaying, promoting, or distributing invalid, expired, fabricated, or unauthorized coupon codes to artificially drive clicks is banned.</li>
                <li><strong className="text-slate-800">No Misleading Pricing (Bait-and-Switch):</strong> You must not deceive users by displaying a falsely low price or a massive, non-existent discount on your FavyLink page, only to redirect them to a full-priced product on the retailer's site. All pricing, deals, and promotional text must be genuine and accurately reflect the retailer's actual offer at the time of posting.</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">10. Third-Party Affiliate Aggregators & Data Privacy</h2>
              <p className="mb-3">To provide you with seamless link conversion tools and to fetch the highest-paying deals automatically, FavyLink integrates with trusted, reliable third-party affiliate aggregator networks.</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li><strong className="text-slate-800">Network Compliance:</strong> FavyLink and its creators must strictly adhere to the operational terms, conditions, and compliance guidelines set forth by these third-party aggregator networks.</li>
                <li><strong className="text-slate-800">Strict Data Protection:</strong> Your privacy is our utmost priority. FavyLink does not and will not share your sensitive personal or financial information—including your email address, mobile number, bank account details, or UPI ID—with these third-party aggregators.</li>
                <li><strong className="text-slate-800">Data Shared:</strong> The only data point shared with our third-party aggregator partners is your unique FavyLink Username. This acts merely as a standard public identifier to track your generated links, as this username is already publicly visible on your storefront URL.</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">11. Modifications to Terms</h2>
              <p>FavyLink reserves the right to modify, update, or alter these Terms & Conditions at any time to reflect changes in our business model, legal requirements, or partner brand policies. Continued use of the platform following any such changes constitutes your acceptance of the revised Terms.</p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">12. Contact Us</h2>
              <p>If you have any questions, require clarification on these terms, or need assistance regarding your account and payouts, please contact our dedicated support team at:</p>
              <p className="mt-2 font-bold text-blue-600 text-lg">Email: support@favylink.com</p>
            </section>

          </div>
        </div>
      </main>

      {/* ========================================== */}
      {/* COMPACT REUSABLE FOOTER */}
      {/* ========================================== */}
      <CompactFooter />

    </div>
  );
}