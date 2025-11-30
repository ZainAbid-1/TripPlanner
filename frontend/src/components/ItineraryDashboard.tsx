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

interface ItineraryDashboardProps {
  onNavigate: (screen: string) => void;
  tripData: FinalItinerary | null;
}

export function ItineraryDashboard({ onNavigate, tripData }: ItineraryDashboardProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  if (!tripData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <Sparkles className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Itinerary Generated</h2>
            <p className="text-gray-600 mb-6">Please go to the Chat page to plan your trip.</p>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => onNavigate('home')} className="mb-4 pl-0 hover:bg-transparent hover:text-blue-600">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tripData.trip_title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">{tripData.destination}</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>{tripData.daily_plans.length} Days</span>
                </div>
                {tripData.total_estimated_cost ? (
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                    <span className="font-bold text-green-600">Est. ${tripData.total_estimated_cost}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2 bg-white">
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button 
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white gap-2 shadow-md hover:shadow-lg border-0" 
                onClick={() => onNavigate('booking')}
              >
                <Sparkles className="h-4 w-4" /> View Flights & Hotels
              </Button>
            </div>
          </div>

          <div className="mt-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-gray-600 leading-relaxed">{tripData.trip_summary}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: ITINERARY */}
          <div className="lg:col-span-2 space-y-6">
            {tripData.daily_plans.map((day) => (
              <Card key={day.day} className="overflow-hidden border-0 shadow-sm ring-1 ring-gray-100">
                <CardHeader
                  className="cursor-pointer bg-white hover:bg-gray-50 transition-colors border-b border-gray-50 py-4"
                  onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-600 text-white font-bold h-10 w-10 flex flex-col items-center justify-center rounded-lg shadow-sm">
                        <span className="text-[9px] uppercase font-medium opacity-80">Day</span>
                        <span className="text-lg leading-none">{day.day}</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">{day.title}</CardTitle>
                      </div>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${expandedDay === day.day ? 'rotate-180' : ''}`} />
                  </div>
                </CardHeader>

                {expandedDay === day.day && (
                  <CardContent className="pt-6 bg-white">
                    <div className="relative pl-6 space-y-8">
                      <div className="absolute left-[11px] top-2 bottom-6 w-[2px] bg-gray-100" />
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
                              <div className="h-8 w-8 rounded-full bg-white border-2 border-blue-100 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                                <Icon className="h-4 w-4 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1 pb-2">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-1">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="text-[10px] font-medium bg-gray-100 text-gray-600">
                                      {activity.time}
                                    </Badge>
                                  </div>
                                  <h4 className="text-base font-bold text-gray-900">{activity.title}</h4>
                                </div>
                                {activity.estimated_cost_usd && activity.estimated_cost_usd > 0 ? (
                                  <span className="text-sm font-medium text-green-600">
                                    ${activity.estimated_cost_usd}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">{activity.description}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* RIGHT COLUMN: INFO */}
          <div className="space-y-6">
            {/* Budget Breakdown */}
            <Card className="border-0 shadow-sm ring-1 ring-gray-100">
              <CardHeader className="bg-gray-900 text-white rounded-t-xl py-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" /> Budget Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                 <p className="text-sm text-gray-600 whitespace-pre-line mb-4">
                   {tripData.budget_overview || "Calculated based on average costs."}
                 </p>
                 <Separator className="my-4"/>
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Total Est.</span>
                    <span className="text-xl font-bold text-green-600">${tripData.total_estimated_cost || 0}</span>
                 </div>
              </CardContent>
            </Card>

            {/* Travel Tip */}
            <Card className="border-0 shadow-sm ring-1 ring-gray-100 overflow-hidden">
               <div className="h-40 bg-gray-200 relative">
                  <img 
                    src={`https://source.unsplash.com/800x600/?${encodeURIComponent(tripData.destination)},landmark`}
                    alt={tripData.destination}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 text-white">
                    <h3 className="text-xl font-bold">{tripData.destination}</h3>
                  </div>
               </div>
               <CardContent className="p-4">
                 <p className="text-sm text-gray-600">
                   <strong>Travel Tip:</strong> {tripData.travel_tips || `Pack accordingly for ${tripData.destination}.`}
                 </p>
               </CardContent>
            </Card>

            {/* Notes Box */}
            <NotesCard />
          </div>

        </div>
      </div>
    </div>
  );
}
