import { useState } from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Calendar,
  DollarSign,
  Edit,
  Share2,
  Download,
  Cloud,
  Sun,
  Plane,
  Hotel,
  Utensils,
  Camera,
  Clock,
  Users,
  TrendingDown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ItineraryDashboardProps {
  onNavigate: (screen: string) => void;
}

export function ItineraryDashboard({ onNavigate }: ItineraryDashboardProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [activeVersion, setActiveVersion] = useState<'standard' | 'budget' | 'luxury'>('standard');

  const itinerary = {
    title: 'Romantic Paris Getaway',
    destination: 'Paris, France',
    duration: '7 Days',
    travelers: 2,
    dates: 'May 15-22, 2025',
    budget: {
      total: 2000,
      spent: 1850,
      categories: [
        { name: 'Flights', amount: 740, percentage: 40 },
        { name: 'Hotels', amount: 555, percentage: 30 },
        { name: 'Food', amount: 370, percentage: 20 },
        { name: 'Activities', amount: 185, percentage: 10 },
      ],
    },
    days: [
      {
        day: 1,
        title: 'Arrival in Paris',
        date: 'May 15, 2025',
        weather: { temp: 18, condition: 'Sunny' },
        activities: [
          {
            time: '10:00 AM',
            type: 'flight',
            title: 'Arrival at CDG Airport',
            description: 'Flight from New York (JFK)',
            duration: '7h 30m',
            cost: 740,
          },
          {
            time: '1:00 PM',
            type: 'hotel',
            title: 'Check-in at Le Marais Hotel',
            description: 'Boutique hotel in historic Le Marais district',
            duration: '30m',
            cost: 555,
            image: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJpcyUyMGVpZmZlbCUyMHRvd2VyfGVufDF8fHx8MTc1OTk4OTM0Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
          },
          {
            time: '3:00 PM',
            type: 'activity',
            title: 'Walking Tour of Le Marais',
            description: 'Explore charming streets, art galleries, and cafés',
            duration: '2h',
            cost: 0,
          },
          {
            time: '7:00 PM',
            type: 'dining',
            title: 'Dinner at Chez Janou',
            description: 'Traditional French bistro',
            duration: '2h',
            cost: 80,
          },
        ],
      },
      {
        day: 2,
        title: 'Iconic Landmarks',
        date: 'May 16, 2025',
        weather: { temp: 20, condition: 'Partly Cloudy' },
        activities: [
          {
            time: '9:00 AM',
            type: 'activity',
            title: 'Eiffel Tower Visit',
            description: 'Skip-the-line tickets to summit',
            duration: '3h',
            cost: 60,
          },
          {
            time: '12:30 PM',
            type: 'dining',
            title: 'Lunch at Café de l\'Homme',
            description: 'Restaurant with Eiffel Tower views',
            duration: '1h 30m',
            cost: 90,
          },
          {
            time: '3:00 PM',
            type: 'activity',
            title: 'Seine River Cruise',
            description: 'Romantic boat tour with audio guide',
            duration: '1h 15m',
            cost: 45,
          },
          {
            time: '6:00 PM',
            type: 'activity',
            title: 'Arc de Triomphe & Champs-Élysées',
            description: 'Evening stroll down famous avenue',
            duration: '2h',
            cost: 0,
          },
        ],
      },
      {
        day: 3,
        title: 'Art & Culture',
        date: 'May 17, 2025',
        weather: { temp: 19, condition: 'Cloudy' },
        activities: [
          {
            time: '9:30 AM',
            type: 'activity',
            title: 'Louvre Museum',
            description: 'Guided tour including Mona Lisa',
            duration: '4h',
            cost: 85,
          },
          {
            time: '2:00 PM',
            type: 'dining',
            title: 'Lunch at Angelina',
            description: 'Famous for hot chocolate and pastries',
            duration: '1h',
            cost: 45,
          },
          {
            time: '4:00 PM',
            type: 'activity',
            title: 'Musée d\'Orsay',
            description: 'Impressionist masterpieces',
            duration: '2h 30m',
            cost: 40,
          },
        ],
      },
    ],
  };

  const activityIcons = {
    flight: Plane,
    hotel: Hotel,
    dining: Utensils,
    activity: Camera,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-gray-900 mb-2">{itinerary.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{itinerary.destination}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{itinerary.dates}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{itinerary.travelers} Travelers</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                <Sparkles className="h-4 w-4" />
                Optimize
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Version Tabs */}
            <Card>
              <CardContent className="p-6">
                <Tabs value={activeVersion} onValueChange={(v) => setActiveVersion(v as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="budget">Budget Version</TabsTrigger>
                    <TabsTrigger value="standard">Standard</TabsTrigger>
                    <TabsTrigger value="luxury">Luxury</TabsTrigger>
                  </TabsList>
                </Tabs>
                {activeVersion === 'budget' && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-5 w-5 text-green-600" />
                      <span className="text-green-900">Save $450 with budget options</span>
                    </div>
                    <p className="text-sm text-green-700">
                      3-star hotels, local restaurants, and free walking tours
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Day-by-Day Timeline */}
            <div className="space-y-4">
              {itinerary.days.map((day) => (
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
                            {day.date}
                          </div>
                          <div className="flex items-center gap-1">
                            {day.weather.condition === 'Sunny' ? (
                              <Sun className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Cloud className="h-4 w-4 text-gray-400" />
                            )}
                            {day.weather.temp}°C, {day.weather.condition}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        {expandedDay === day.day ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  {expandedDay === day.day && (
                    <CardContent className="pt-0">
                      <Separator className="mb-6" />
                      <div className="space-y-4">
                        {day.activities.map((activity, index) => {
                          const Icon = activityIcons[activity.type as keyof typeof activityIcons];
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
                                      <Badge variant="outline" className="text-xs">
                                        {activity.duration}
                                      </Badge>
                                    </div>
                                    <h4 className="text-gray-900">{activity.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {activity.cost > 0 && (
                                      <Badge className="bg-green-100 text-green-800 border-0">
                                        ${activity.cost}
                                      </Badge>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {activity.image && (
                                  <div className="mt-3 rounded-lg overflow-hidden">
                                    <ImageWithFallback
                                      src={activity.image}
                                      alt={activity.title}
                                      className="w-full h-48 object-cover"
                                    />
                                  </div>
                                )}

                                {activity.type === 'hotel' && (
                                  <div className="mt-3">
                                    <Button
                                      className="bg-orange-500 hover:bg-orange-600 text-white"
                                      onClick={() => onNavigate('booking')}
                                    >
                                      Book Now
                                    </Button>
                                  </div>
                                )}
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
            {/* Budget Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Budget Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Total Budget</span>
                    <span className="text-gray-900">${itinerary.budget.total}</span>
                  </div>
                  <Progress value={(itinerary.budget.spent / itinerary.budget.total) * 100} />
                  <p className="text-sm text-gray-600 mt-2">
                    ${itinerary.budget.spent} spent • ${itinerary.budget.total - itinerary.budget.spent} remaining
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  {itinerary.budget.categories.map((category, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{category.name}</span>
                        <span className="text-gray-900">${category.amount}</span>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <TrendingDown className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-900">Savings Highlight</p>
                      <p className="text-xs text-blue-700 mt-1">
                        You saved $150 compared to average prices!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Route Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Interactive map</p>
                    <p className="text-xs text-gray-500">Powered by Google Maps</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-900">Add Versailles Day Trip</p>
                  <p className="text-xs text-purple-700 mt-1">Based on your interests</p>
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    Add to Day 4
                  </Button>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-900">Eco-Friendly Option</p>
                  <p className="text-xs text-green-700 mt-1">Take metro instead of taxi</p>
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
