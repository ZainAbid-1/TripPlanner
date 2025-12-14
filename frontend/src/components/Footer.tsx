import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export function Footer() {
  const socialLinks = {
    instagram: "https://www.instagram.com/tripplanners_?igsh=aTV2Nm1jbnp4Ng==",
    twitter: "https://twitter.com/your-app-name",
    facebook: "https://facebook.com/your-app-name",
    youtube: "https://youtube.com/your-channel-name",
  };

  return (
    <footer className="glass-subtle border-t border-white/10 backdrop-blur-xl mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <h3 className="text-xl font-bold gradient-text mb-4">VoyageAI</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              AI-powered travel planning with personalized itineraries, real-time data, and smart recommendations.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-slate-300 hover:text-purple-400 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-300 hover:text-purple-400 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-300 hover:text-purple-400 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-300 hover:text-purple-400 transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-slate-300 hover:text-purple-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-300 hover:text-purple-400 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-300 hover:text-purple-400 transition-colors">
                  Affiliate Disclosure
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-300 hover:text-purple-400 transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Connect With Us</h3>
            <div className="flex space-x-3">
              <button
                onClick={() => window.open(socialLinks.facebook, '_blank')}
                className="glass-subtle p-3 rounded-xl text-slate-300 hover:text-white hover:scale-110 transition-all"
                title="Follow on Facebook"
              >
                <Facebook className="h-5 w-5" />
              </button>
              <button
                onClick={() => window.open(socialLinks.twitter, '_blank')}
                className="glass-subtle p-3 rounded-xl text-slate-300 hover:text-white hover:scale-110 transition-all"
                title="Follow on Twitter"
              >
                <Twitter className="h-5 w-5" />
              </button>
              <button
                onClick={() => window.open(socialLinks.instagram, '_blank')}
                className="glass-subtle p-3 rounded-xl text-slate-300 hover:text-white hover:scale-110 transition-all"
                title="Follow on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </button>
              <button
                onClick={() => window.open(socialLinks.youtube, '_blank')}
                className="glass-subtle p-3 rounded-xl text-slate-300 hover:text-white hover:scale-110 transition-all"
                title="Subscribe on YouTube"
              >
                <Youtube className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-8 text-sm text-center text-slate-400">
          <p>&copy; 2025 VoyageAI. All rights reserved.</p>
          <p className="mt-2">
            Affiliate Disclosure: We may earn commissions from bookings made through our links.
          </p>
        </div>
      </div>
    </footer>
  );
}