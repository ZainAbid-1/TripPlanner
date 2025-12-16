import { useState } from 'react';
import { motion } from 'motion/react';
import {
  MapPin, Calendar, Share2, 
  Plane, Hotel, Utensils, Users, Sparkles,
  ChevronDown, ArrowLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { FinalItinerary } from '../types';
import { NotesCard } from './ui/NotesCard';
import { DestinationImage } from './ui/DestinationImage';

interface ItineraryDashboardProps {
  onNavigate: (screen: string) => void;
  tripData: FinalItinerary | null;
}

export function ItineraryDashboard({ onNavigate, tripData }: ItineraryDashboardProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  if (!tripData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="glass-strong p-10 rounded-3xl shadow-2xl">
            <Sparkles className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-3xl font-bold gradient-text mb-3">No Itinerary Yet</h2>
            <p className="text-slate-300 mb-8 leading-relaxed">Start planning your dream trip with AI assistance</p>
            <Button className="btn-primary w-full py-4" onClick={() => onNavigate('chat')}>
              Start Planning
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('flight') || t.includes('arrival')) return Plane;
    if (t.includes('hotel') || t.includes('check-in')) return Hotel;
    if (t.includes('food') || t.includes('dinner') || t.includes('lunch')) return Utensils;
    return MapPin;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('home')} 
              className="mb-6 pl-0 hover:bg-white/10 text-slate-200 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
            </Button>
          </motion.div>

          <motion.div 
            className="flex flex-col lg:flex-row lg:items-start gap-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex-1">
              <h1 className="text-5xl font-bold text-white mb-6 text-shadow">{tripData.trip_title}</h1>
              
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <motion.div 
                  className="glass flex items-center gap-2 px-5 py-2.5 rounded-full shadow-lg"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <MapPin className="h-5 w-5 text-pink-400" />
                  <span className="font-semibold text-white">{tripData.destination}</span>
                </motion.div>
                <motion.div 
                  className="glass flex items-center gap-2 px-5 py-2.5 rounded-full shadow-lg"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Calendar className="h-5 w-5 text-cyan-400" />
                  <span className="text-white font-semibold">{tripData.daily_plans.length} Days</span>
                </motion.div>
              </div>

              <div className="flex flex-wrap gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="btn-secondary gap-2">
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    className="btn-primary gap-2" 
                    onClick={() => onNavigate('booking')}
                  >
                    <Sparkles className="h-4 w-4" /> View Flights & Hotels
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="glass-strong p-6 rounded-3xl shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-slate-200 leading-relaxed text-lg">{tripData.trip_summary}</p>
          </motion.div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">
            {tripData.daily_plans.map((day, dayIndex) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + (dayIndex * 0.1) }}
              >
              <div className="card-glass overflow-hidden hover:shadow-2xl transition-shadow">
                <div
                  className="cursor-pointer glass-subtle hover:glass transition-all py-5 px-6"
                  onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 text-white font-bold h-14 w-14 flex flex-col items-center justify-center rounded-2xl shadow-lg shadow-purple-500/30 animate-glow-pulse">
                        <span className="text-[10px] uppercase font-semibold opacity-90">Day</span>
                        <span className="text-2xl leading-none">{day.day}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{day.title}</h3>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`h-6 w-6 text-slate-300 transition-transform duration-300 ${
                        expandedDay === day.day ? 'rotate-180' : ''
                      }`} 
                    />
                  </div>
                </div>

                {expandedDay === day.day && (
                  <div className="pt-6 pb-8 px-6 glass-subtle">
                    <div className="relative pl-8 space-y-8">
                      <div className="absolute left-[15px] top-2 bottom-6 w-[3px] bg-gradient-to-b from-purple-500 via-pink-500 to-cyan-500 rounded-full shadow-lg shadow-purple-500/50" />
                      {day.activities.map((activity, index) => {
                        const Icon = getActivityIcon(activity.type);
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative flex gap-4 group"
                          >
                            <div className="relative z-10 flex flex-col items-center">
                              <div className="h-10 w-10 rounded-xl glass-strong border-2 border-purple-400 flex items-center justify-center group-hover:scale-110 group-hover:border-pink-400 group-hover:shadow-xl group-hover:shadow-purple-500/50 transition-all">
                                <Icon className="h-5 w-5 text-purple-400 group-hover:text-pink-400" />
                              </div>
                            </div>
                            <div className="flex-1 pb-2">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className="text-xs font-semibold bg-purple-600/80 text-white border-purple-500/50 px-3 py-1">
                                      {activity.time}
                                    </Badge>
                                  </div>
                                  <h4 className="text-lg font-bold text-white">{activity.title}</h4>
                                </div>
                                {activity.estimated_cost_usd && activity.estimated_cost_usd > 0 ? (
                                  <span className="text-base font-bold text-emerald-400 mt-2 sm:mt-0">
                                    ${activity.estimated_cost_usd}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed">
                                {activity.description}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-6">

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="card-glass overflow-hidden"
            >
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white px-6 py-4">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                  <Users className="h-5 w-5" /> Budget Breakdown
                </h3>
              </div>
              <div className="p-6 glass-subtle">
                <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                  {tripData.budget_overview || "Calculated based on average costs."}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="card-glass overflow-hidden"
            >
              <div className="relative w-full h-48">
                <div className="w-full h-full">
                  <DestinationImage destination={tripData?.destination || ''} />
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

                <div className="absolute bottom-4 left-4 z-10">
                  <h3 className="text-2xl font-bold text-white gradient-text">{tripData?.destination}</h3>
                </div>
              </div>
              <div className="p-5 glass-subtle">
                <p className="text-sm text-slate-200 leading-relaxed">
                  <strong className="text-purple-400">💡 Travel Tip:</strong> {tripData?.travel_tips || `Pack accordingly for ${tripData?.destination}.`}
                </p>
              </div>
            </motion.div>

            <NotesCard />
          </div>

        </div>
      </div>
    </div>
  );
}
