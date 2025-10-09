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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1589395937920-07cce323acba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3JsZCUyMG1hcCUyMHRyYXZlbHxlbnwxfHx8fDE3NTk5NjMzNjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="World Map"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-teal-900/80" />
        </div>

        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4 max-w-4xl"
        >
          <h1 className="text-white mb-6">
            VoyageAI
          </h1>
          <div className="mb-6 inline-flex items-center gap-2 bg-orange-500/20 backdrop-blur-sm px-6 py-3 rounded-full border border-orange-500/50">
            <Sparkles className="h-5 w-5 text-orange-400" />
            <span className="text-2xl text-orange-100">AI-Powered Travel Planning</span>
          </div>
          <h2 className="text-white mb-6">
            Dream, Plan, Go!
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Tell us your preferences, get a custom itinerary in seconds. Powered by multi-agent AI, 
            real-time data, and smart optimization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white border-0"
              onClick={() => onNavigate('chat')}
            >
              Start Planning
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
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
