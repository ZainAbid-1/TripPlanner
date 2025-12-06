import { motion } from 'motion/react';
import { Sparkles, Brain, Zap, Globe, Shield, Users, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LandingPageProps {
  onNavigate: (screen: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const features = [
    {
      icon: Brain,
      title: 'Multi-Agent AI',
      description: 'Research and Booking agents work together to create perfect itineraries',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Zap,
      title: 'Real-Time Data',
      description: 'Live prices, weather, and availability from Google Maps, Kayak & more',
      color: 'from-teal-500 to-teal-600',
    },
    {
      icon: Globe,
      title: 'Smart Optimization',
      description: 'ML-powered recommendations and RL-based itinerary optimization',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Shield,
      title: 'Safety First',
      description: 'Real-time travel advisories and safety alerts for your destinations',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: Users,
      title: 'Collaborate',
      description: 'Plan together with real-time editing and sharing',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Sparkles,
      title: 'Sustainability',
      description: 'Eco-friendly options and carbon footprint tracking',
      color: 'from-emerald-500 to-emerald-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-purple-600">
      {/* Hero Section */}
      <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900 to-purple-600" />
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        </div>

        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-4 max-w-5xl"
        >
          <motion.h1 
            className="text-7xl font-bold text-white mb-6 tracking-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            GRADIENT<br />ABSTRACT DESIGN
          </motion.h1>
          
          <motion.p 
            className="text-xl text-white/90 mb-4 font-light tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Landing Page Template
          </motion.p>
          
          <motion.p 
            className="text-lg text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Plan your perfect journey with AI-powered insights. Tell us your preferences 
            and get a custom itinerary in seconds with real-time data and smart optimization.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <Button
              size="lg"
              className="bg-white text-black hover:bg-white/90 border-0 px-8 py-6 text-lg font-semibold rounded-full shadow-2xl hover:shadow-white/20 transition-all"
              onClick={() => onNavigate('chat')}
            >
              GET STARTED
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-2 border-white/50 hover:bg-white/10 hover:border-white px-8 py-6 text-lg font-semibold rounded-full transition-all"
              onClick={() => onNavigate('chat')}
            >
              VIEW MORE
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Carousel */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to plan the perfect trip, powered by advanced AI technology
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-gray-200">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-white mb-4">Ready to Start Your Adventure?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of travelers who plan smarter with AI
          </p>
          <Button
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white border-0"
            onClick={() => onNavigate('chat')}
          >
            Create Your First Itinerary
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
