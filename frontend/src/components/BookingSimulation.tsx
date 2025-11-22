import { useState } from 'react';
import { motion } from 'motion/react';
import { Plane, Hotel, ShoppingCart, ExternalLink, Star, Check, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { FinalItinerary } from '../types';

interface BookingSimulationProps {
  onNavigate: (screen: string) => void;
  tripData: FinalItinerary | null;
}

export function BookingSimulation({ onNavigate, tripData }: BookingSimulationProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>(['flight', 'hotel']);

  if (!tripData) {
      return <div className="p-8 text-center">No booking data found. Please plan a trip first.</div>;
  }

  // Map Backend Data to UI format
  const bookingItems = [
    {
      id: 'flight',
      type: 'Flight',
      icon: Plane,
      provider: 'Google Flights',
      title: `${tripData.chosen_flight.airline} - ${tripData.chosen_flight.stops} Stops`,
      details: `Duration: ${tripData.chosen_flight.duration_hours}h`,
      price: tripData.chosen_flight.price_usd,
      features: ['Checked bag included', 'Standard Seat'],
      rating: 4.2,
      link: tripData.chosen_flight.booking_url
    },
    {
      id: 'hotel',
      type: 'Hotel',
      icon: Hotel,
      provider: 'Booking.com',
      title: tripData.chosen_hotel.name,
      details: tripData.chosen_hotel.summary,
      price: tripData.chosen_hotel.price_per_night_usd * 5, // Estimating 5 nights or need trip duration
      features: ['Free WiFi', 'Great Location'],
      rating: tripData.chosen_hotel.rating,
      link: tripData.chosen_hotel.booking_url
    },
  ];

  const totalPrice = bookingItems
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Booking Summary</h1>
          <p className="text-gray-600">Based on your approved itinerary for {tripData.destination}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Prices are estimates based on real-time search data.
              </AlertDescription>
            </Alert>

            {bookingItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={selectedItems.includes(item.id) ? 'border-blue-500' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <item.icon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <Badge variant="outline" className="mb-1">{item.type}</Badge>
                              <p className="text-xs text-gray-500">via {item.provider}</p>
                            </div>
                          </div>
                          <CardTitle className="text-gray-900 mb-1">{item.title}</CardTitle>
                          <p className="text-sm text-gray-600">{item.details}</p>
                          
                          <div className="flex items-center gap-2 mt-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                              <span className="text-sm text-gray-900">{item.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl text-gray-900">${item.price}</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <Separator className="mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {item.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="h-4 w-4 text-green-600" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => item.link && window.open(item.link, '_blank')}
                        disabled={!item.link}
                      >
                        Book Now
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Estimated Total
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-900">Total</span>
                    <span className="text-2xl text-gray-900">${totalPrice}</span>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
                    Confirm & Save Itinerary
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 