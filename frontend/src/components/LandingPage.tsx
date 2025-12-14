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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[120px]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-500/30 rounded-full blur-[120px]"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute top-1/2 right-1/3 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px]"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, 50, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-4 max-w-6xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold mb-6 tracking-tight leading-none">
              <span className="gradient-text text-glow">VOYAGE</span>
              <br />
              <span className="text-white text-shadow">AI</span>
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-2xl md:text-3xl text-slate-200 mb-4 font-light tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Your AI-Powered Journey Begins
          </motion.p>
          
          <motion.p 
            className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Experience the future of travel planning with multi-agent AI. 
            Get personalized itineraries with real-time data in seconds.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <Button
              size="lg"
              className="btn-primary text-lg px-10 py-7 group"
              onClick={() => onNavigate('chat')}
            >
              START PLANNING
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              className="btn-secondary text-lg px-10 py-7"
              onClick={() => onNavigate('chat')}
            >
              EXPLORE FEATURES
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-16 flex items-center justify-center gap-2"
          >
            <Badge className="glass border-white/20 text-slate-200 px-4 py-1.5">
              <Sparkles className="h-3 w-3 mr-1 text-purple-400" />
              AI-Powered
            </Badge>
            <Badge className="glass border-white/20 text-slate-200 px-4 py-1.5">
              Real-time Data
            </Badge>
            <Badge className="glass border-white/20 text-slate-200 px-4 py-1.5">
              Smart Optimization
            </Badge>
          </motion.div>
        </motion.div>
      </section>

      <section className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Powerful Features</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Everything you need for the perfect journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <div className="card-glass h-full group hover:glow-purple cursor-pointer">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-purple-900/20" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your <span className="gradient-text">Adventure</span>?
            </h2>
            <p className="text-xl text-slate-300 mb-10">
              Join thousands of travelers planning smarter with AI
            </p>
            <Button
              size="lg"
              className="btn-primary text-lg px-12 py-7 group"
              onClick={() => onNavigate('chat')}
            >
              Create Your First Itinerary
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
