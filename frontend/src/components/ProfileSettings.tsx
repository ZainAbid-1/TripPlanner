import { useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Mail,
  Bell,
  CreditCard,
  Globe,
  Shield,
  Star,
  Crown,
  BookOpen,
  MapPin,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProfileSettingsProps {
  onNavigate: (screen: string) => void;
}

export function ProfileSettings({ onNavigate }: ProfileSettingsProps) {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    deals: false,
  });

  const pastTrips = [
    {
      destination: 'Paris, France',
      date: 'May 2024',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJpcyUyMGVpZmZlbCUyMHRvd2VyfGVufDF8fHx8MTc1OTk4OTM0Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    {
      destination: 'Tokyo, Japan',
      date: 'December 2023',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1602283662099-1c6c158ee94d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2t5byUyMGphcGFuJTIwY2l0eXxlbnwxfHx8fDE3NTk5NzU5NzN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    {
      destination: 'Santorini, Greece',
      date: 'August 2023',
      rating: 4,
      image: 'https://images.unsplash.com/photo-1669203408570-4140ee21f211?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW50b3JpbmklMjBncmVlY2UlMjBzdW5zZXR8ZW58MXx8fHwxNzU5OTczMjQ2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
  ];

  const stats = [
    { icon: MapPin, label: 'Countries Visited', value: '12' },
    { icon: BookOpen, label: 'Trips Planned', value: '24' },
    { icon: TrendingUp, label: 'Money Saved', value: '$2,450' },
    { icon: Award, label: 'Member Since', value: '2023' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Profile & Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-3xl mx-auto mb-4">
                    JD
                  </div>
                  <h3 className="text-gray-900 mb-1">John Doe</h3>
                  <p className="text-sm text-gray-600 mb-4">john.doe@email.com</p>
                  <Badge className="bg-orange-500 text-white border-0">
                    <Crown className="h-3 w-3 mr-1" />
                    Free Plan
                  </Badge>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  {stats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <stat.icon className="h-4 w-4" />
                        {stat.label}
                      </div>
                      <span className="text-gray-900">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Card */}
            <Card className="bg-gradient-to-br from-orange-500 to-pink-500 text-white border-0">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="h-6 w-6" />
                  <h3 className="text-white">Upgrade to Pro</h3>
                </div>
                <ul className="space-y-2 text-sm mb-4">
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>Unlimited itineraries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>Priority AI optimization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>Advanced collaboration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>Exclusive deals & discounts</span>
                  </li>
                </ul>
                <Button className="w-full bg-white text-orange-600 hover:bg-gray-100">
                  Upgrade Now - $9.99/mo
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="trips" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="trips">My Trips</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              {/* My Trips */}
              <TabsContent value="trips" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-900">Past Trips</CardTitle>
                    <CardDescription>Your travel history and feedback</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pastTrips.map((trip, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex">
                            <div className="w-32 h-32 flex-shrink-0">
                              <ImageWithFallback
                                src={trip.image}
                                alt={trip.destination}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <CardContent className="flex-1 p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="text-gray-900">{trip.destination}</h4>
                                  <p className="text-sm text-gray-600">{trip.date}</p>
                                </div>
                                <div className="flex">
                                  {[...Array(trip.rating)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-orange-500 text-orange-500" />
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                                <Button variant="outline" size="sm">
                                  Book Again
                                </Button>
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-900">Saved Itineraries</CardTitle>
                    <CardDescription>Draft and upcoming trips</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-4">No saved itineraries yet</p>
                      <Button
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => onNavigate('chat')}
                      >
                        Create New Itinerary
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings */}
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-900">Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <input
                          id="name"
                          type="text"
                          defaultValue="John Doe"
                          className="w-full mt-2 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <input
                          id="email"
                          type="email"
                          defaultValue="john.doe@email.com"
                          className="w-full mt-2 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-900">Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-600" />
                        <div>
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-gray-600">Receive trip updates via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, email: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-gray-600" />
                        <div>
                          <Label>Push Notifications</Label>
                          <p className="text-sm text-gray-600">Get real-time travel alerts</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.push}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, push: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-gray-600" />
                        <div>
                          <Label>Deal Alerts</Label>
                          <p className="text-sm text-gray-600">Special offers and discounts</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.deals}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, deals: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences */}
              <TabsContent value="preferences" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-900">Travel Preferences</CardTitle>
                    <CardDescription>Help our AI understand your style</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Preferred Travel Style</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {['Budget', 'Comfort', 'Luxury', 'Adventure'].map((style) => (
                          <Button key={style} variant="outline" className="justify-start">
                            {style}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label>Interests</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {['Culture', 'Food', 'Nature', 'Adventure', 'Relaxation', 'Shopping'].map(
                          (interest) => (
                            <Button key={interest} variant="outline" className="justify-start">
                              {interest}
                            </Button>
                          )
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label>Sustainability Preference</Label>
                      <Progress value={75} className="mt-2" />
                      <p className="text-sm text-gray-600 mt-2">
                        High priority on eco-friendly options
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
