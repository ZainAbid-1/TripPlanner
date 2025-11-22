import { useState } from 'react';
import { motion } from 'motion/react';
import {
  MapPin, Calendar, Edit, Share2, Download, Cloud, Sun,
  Plane, Hotel, Utensils, Camera, Clock, Users, Sparkles,
  ChevronDown, ChevronUp, GripVertical
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { FinalItinerary } from '../types'; // Import shared types

interface ItineraryDashboardProps {
  onNavigate: (screen: string) => void;
  tripData: FinalItinerary | null; // Dynamic Data
}

export function ItineraryDashboard({ onNavigate, tripData }: ItineraryDashboardProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  // Loading State if no data
  if (!tripData) {
    return <div className="p-8 text-center">No itinerary data available. Please plan a trip first.</div>;
  }

  // Helper to map backend activity types to Icons
  const getActivityIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('flight') || lowerType.includes('travel')) return Plane;
    if (lowerType.includes('hotel') || lowerType.includes('accommodation')) return Hotel;
    if (lowerType.includes('dining') || lowerType.includes('food')) return Utensils;
    return Camera; // Default
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-gray-900 mb-2">{tripData.trip_title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{tripData.destination}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Trip Plan</span>
                </div>
              </div>
              <p className="mt-2 text-gray-600 max-w-2xl">{tripData.trip_summary}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2" onClick={() => onNavigate('booking')}>
                <Sparkles className="h-4 w-4" /> Book This Trip
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content: Day-by-Day */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              {tripData.daily_plans.map((day) => (
                <Card key={day.day} className="overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className="bg-blue-600 text-white">Day {day.day}</Badge>
                          <CardTitle className="text-gray-900">{day.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {day.date || `Day ${day.day}`}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        {expandedDay === day.day ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </div>
                  </CardHeader>

                  {expandedDay === day.day && (
                    <CardContent className="pt-0">
                      <Separator className="mb-6" />
                      <div className="space-y-4">
                        {day.activities.map((activity, index) => {
                          const Icon = getActivityIcon(activity.type);
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex gap-4 group"
                            >
                              <div className="flex flex-col items-center">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <Icon className="h-5 w-5 text-blue-600" />
                                </div>
                                {index < day.activities.length - 1 && (
                                  <div className="w-0.5 flex-1 bg-gray-200 my-2" />
                                )}
                              </div>

                              <div className="flex-1 pb-6">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Clock className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm text-gray-600">{activity.time}</span>
                                    </div>
                                    <h4 className="text-gray-900">{activity.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {activity.estimated_cost_usd && activity.estimated_cost_usd > 0 && (
                                      <Badge className="bg-green-100 text-green-800 border-0">
                                        ${activity.estimated_cost_usd}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Budget Text from Backend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Budget Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p className="text-sm text-gray-600 leading-relaxed">
                   {tripData.budget_overview}
                 </p>
              </CardContent>
            </Card>

            {/* Map Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Destination</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <ImageWithFallback 
                      src={`https://source.unsplash.com/800x600/?${encodeURIComponent(tripData.destination)}`}
                      alt={tripData.destination}
                      className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-center text-sm">
                    {tripData.destination}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}