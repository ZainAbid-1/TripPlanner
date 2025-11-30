import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export function Footer() {
  const socialLinks = {
    instagram: "https://www.instagram.com/tripplanners_?igsh=aTV2Nm1jbnp4Ng==",
    twitter: "https://twitter.com/your-app-name",
    facebook: "https://facebook.com/your-app-name",
    youtube: "https://youtube.com/your-channel-name",
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white mb-4">About VoyageAI</h3>
            <p className="text-sm">
              AI-powered travel planning with personalized itineraries, real-time data, and smart recommendations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Affiliate Disclosure
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => window.open(socialLinks.facebook, '_blank')}
                className="text-gray-300 hover:text-white transition-colors"
                title="Follow on Facebook"
              >
                <Facebook className="h-5 w-5" />
              </button>
              <button
                onClick={() => window.open(socialLinks.twitter, '_blank')}
                className="text-gray-300 hover:text-white transition-colors"
                title="Follow on Twitter"
              >
                <Twitter className="h-5 w-5" />
              </button>
              <button
                onClick={() => window.open(socialLinks.instagram, '_blank')}
                className="text-gray-300 hover:text-white transition-colors"
                title="Follow on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </button>
              <button
                onClick={() => window.open(socialLinks.youtube, '_blank')}
                className="text-gray-300 hover:text-white transition-colors"
                title="Subscribe on YouTube"
              >
                <Youtube className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; 2025 VoyageAI. All rights reserved.</p>
          <p className="mt-2">
            Affiliate Disclosure: We may earn commissions from bookings made through our links.
          </p>
        </div>
      </div>
    </footer>
  );
}