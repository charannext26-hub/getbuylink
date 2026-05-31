import Link from 'next/link';
import CompactFooter from '../../components/CompactFooter';

export default function AffiliateDisclosurePage() {
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      {/* ========================================== */}
      {/* NAVBAR FOR LEGAL PAGES */}
      {/* ========================================== */}
      <nav className="w-full bg-white border-b border-slate-200 z-50 sticky top-0 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Flat PNG Logo Only */}
          <Link href="/" className="flex items-center cursor-pointer">
            <img 
              src="https://pluspng.com/img-png/logo-flipkart-png-flipkart-logo-5000.png" 
              className="h-8 sm:h-10 w-auto object-contain" 
              alt="FavyLink Logo" 
            />
          </Link>

          {/* Navigation Buttons (Home & Dashboard) */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-blue-50 px-3 sm:px-4 py-2 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span className="hidden sm:inline">Home</span>
            </Link>
            
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
          
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Affiliate Disclosure</h1>
          <p className="text-slate-500 font-medium mb-8 pb-8 border-b border-slate-100">Effective Date: June 1, 2026</p>

          <div className="space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
            
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Transparency & Affiliate Disclosure</h2>
              <p className="mb-3">
                FavyLink (favylink.com) is a platform dedicated to empowering creators, influencers, and professionals to build seamless storefronts and share their favorite products with their audience.
              </p>
              <p>
                Transparency and trust are our core values. To comply with global guidelines, including the FTC (Federal Trade Commission) and ASCI (Advertising Standards Council of India), we are providing this comprehensive disclosure regarding the use of affiliate links on our platform.
              </p>
            </div>

            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. What Are Affiliate Links?</h2>
              <p className="mb-3">
                The product links, banners, and curated deals displayed on a creator&apos;s FavyLink storefront are often &quot;affiliate links.&quot; This means that FavyLink and the respective creator have a financial relationship with the partner retailer.
              </p>
              <p>
                When you (the visitor) click on one of these links and make a purchase, FavyLink and the creator may earn a small percentage of the sale as a commission.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. No Extra Cost to You</h2>
              <p>
                Please be assured that clicking on these affiliate links and making a purchase will <strong className="text-slate-800">never cost you anything extra</strong>. The price of the product remains exactly the same whether you use our affiliate link or go directly to the retailer&apos;s website. The commission earned is paid entirely by the retailer as a referral reward.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Amazon Associates Disclosure</h2>
              <p>
                FavyLink and its creators participate in the Amazon Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon properties. As an Amazon Associate, we earn from qualifying purchases.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Impartial Recommendations</h2>
              <p>
                While FavyLink automates and fetches top deals, the creators have the ultimate choice in what they promote on their storefronts. The presence of an affiliate link does not influence the creator&apos;s genuine opinion or review of a product. We encourage our creators to only promote products they truly believe will add value to their audience.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Liability Disclaimer</h2>
              <p className="mb-3">
                FavyLink acts as a bridge between the creator, the buyer, and the retailer. We do not manufacture, store, ship, or handle customer service for the products featured on our platform.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 marker:text-blue-500">
                <li>Any issues regarding product quality, shipping delays, refunds, or customer support must be addressed directly with the respective retailer (e.g., Amazon, Myntra, Flipkart).</li>
                <li>FavyLink cannot be held liable for any damages, losses, or dissatisfaction arising from purchases made through our external affiliate links.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Contact Us</h2>
              <p>If you have any questions regarding our affiliate relationships or this disclosure, please contact us at:</p>
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