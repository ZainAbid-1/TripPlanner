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
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
        <div className="text-center max-w-md">
          <div className="bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-700">
            <Sparkles className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Itinerary Generated</h2>
            <p className="text-gray-300 mb-6">Please go to the Chat page to plan your trip.</p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onNavigate('chat')}>
              Go to Chat
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
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('home')} 
              className="mb-6 pl-0 hover:bg-gray-900 text-white hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
            </Button>
          </motion.div>

          {/* Title & Info */}
          <motion.div 
            className="flex flex-col lg:flex-row lg:items-start gap-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-4">{tripData.trip_title}</h1>
              
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <motion.div 
                  className="flex items-center gap-2 bg-gray-900 px-4 py-2 rounded-full shadow-lg border border-gray-700"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <MapPin className="h-4 w-4 text-orange-400" />
                  <span className="font-medium text-white">{tripData.destination}</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 bg-gray-900 px-4 py-2 rounded-full shadow-lg border border-gray-700"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-white">{tripData.daily_plans.length} Days</span>
                </motion.div>
                {tripData.total_estimated_cost ? (
                  <motion.div 
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600/80 to-green-600/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-emerald-400/30"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <span className="font-bold text-white">Est. ${tripData.total_estimated_cost}</span>
                  </motion.div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="outline" className="gap-2 bg-gray-900 border-gray-700 text-white hover:bg-gray-800 hover:text-white transition-colors">
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    className="bg-gradient-to-r from-orange-500 to-pink-500 text-white gap-2 shadow-lg hover:shadow-xl border-0 hover:from-orange-600 hover:to-pink-600 transition-all" 
                    onClick={() => onNavigate('booking')}
                  >
                    <Sparkles className="h-4 w-4" /> View Flights & Hotels
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Trip Summary */}
          <motion.div 
            className="bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-white leading-relaxed">{tripData.trip_summary}</p>
          </motion.div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: Itinerary */}
          <div className="lg:col-span-2 space-y-6">
            {tripData.daily_plans.map((day, dayIndex) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + (dayIndex * 0.1) }}
              >
              <Card className="overflow-hidden border-0 shadow-2xl bg-gray-900 ring-1 ring-gray-700">
                <CardHeader
                  className="cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors border-b border-gray-700 py-4"
                  onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold h-12 w-12 flex flex-col items-center justify-center rounded-xl shadow-lg">
                        <span className="text-[9px] uppercase font-medium opacity-90">Day</span>
                        <span className="text-lg leading-none">{day.day}</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">{day.title}</CardTitle>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`h-5 w-5 text-gray-300 transition-transform duration-300 ${
                        expandedDay === day.day ? 'rotate-180' : ''
                      }`} 
                    />
                  </div>
                </CardHeader>

                {expandedDay === day.day && (
                  <CardContent className="pt-6 bg-black">
                    <div className="relative pl-6 space-y-8">
                      <div className="absolute left-[11px] top-2 bottom-6 w-[2px] bg-gray-700" />
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
                              <div className="h-8 w-8 rounded-full bg-gray-800 border-2 border-blue-500 flex items-center justify-center group-hover:border-blue-400 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all">
                                <Icon className="h-4 w-4 text-blue-400" />
                              </div>
                            </div>
                            <div className="flex-1 pb-2">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-1">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="text-[10px] font-medium bg-blue-600 text-white border border-blue-500">
                                      {activity.time}
                                    </Badge>
                                  </div>
                                  <h4 className="text-base font-bold text-white">{activity.title}</h4>
                                </div>
                                {activity.estimated_cost_usd && activity.estimated_cost_usd > 0 ? (
                                  <span className="text-sm font-medium text-emerald-400">
                                    ${activity.estimated_cost_usd}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-sm text-gray-300 leading-relaxed">
                                {activity.description}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
              </motion.div>
            ))}
          </div>

          {/* RIGHT COLUMN: Sidebar */}
          <div className="space-y-6">

            {/* Budget Breakdown */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
            <Card className="border-0 shadow-2xl bg-gray-900 ring-1 ring-gray-700">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg py-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" /> Budget Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-white whitespace-pre-line mb-4">
                  {tripData.budget_overview || "Calculated based on average costs."}
                </p>
                <Separator className="my-4 bg-gray-700" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-300">Total Est.</span>
                  <span className="text-xl font-bold text-emerald-400">
                    ${tripData.total_estimated_cost || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Travel Tip Card with Wikipedia Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
            <Card className="border-0 shadow-2xl bg-gray-900 ring-1 ring-gray-700 overflow-hidden">
              <div className="relative w-full">
                {/* Wikipedia/Destination Image - Primary Background */}
                <div className="w-full">
                  <DestinationImage destination={tripData?.destination || ''} />
                </div>
                
                {/* Overlay for better text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                {/* Destination Title */}
                <div className="absolute bottom-3 left-4 text-white z-10">
                  <h3 className="text-xl font-bold">{tripData?.destination}</h3>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-white">
                  <strong className="text-blue-400">Travel Tip:</strong> {tripData?.travel_tips || `Pack accordingly for ${tripData?.destination}.`}
                </p>
              </CardContent>
            </Card>
            </motion.div>

            {/* Notes Card */}
            <NotesCard />
          </div>

        </div>
      </div>
    </div>
  );
}
