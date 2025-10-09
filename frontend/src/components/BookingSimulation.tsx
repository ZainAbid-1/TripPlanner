import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Plane,
  Hotel,
  ShoppingCart,
  ExternalLink,
  Star,
  Wifi,
  Coffee,
  ParkingCircle,
  Check,
  Info,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';

interface BookingSimulationProps {
  onNavigate: (screen: string) => void;
}

export function BookingSimulation({ onNavigate }: BookingSimulationProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>(['flight', 'hotel']);

  const bookingItems = [
    {
      id: 'flight',
      type: 'Flight',
      icon: Plane,
      provider: 'Kayak',
      title: 'New York (JFK) → Paris (CDG)',
      details: 'Round trip • 2 passengers • Economy',
      date: 'May 15-22, 2025',
      price: 740,
      originalPrice: 890,
      affiliate: true,
      features: ['Direct flight', 'Checked bag included', 'Seat selection'],
      rating: 4.5,
      reviews: 1234,
    },
    {
      id: 'hotel',
      type: 'Hotel',
      icon: Hotel,
      provider: 'Booking.com',
      title: 'Le Marais Boutique Hotel',
      details: 'Deluxe Double Room • 7 nights',
      date: 'May 15-22, 2025',
      price: 555,
      originalPrice: 630,
      affiliate: true,
      features: ['Free WiFi', 'Breakfast included', 'Free cancellation'],
      amenities: [Wifi, Coffee, ParkingCircle],
      rating: 4.7,
      reviews: 892,
    },
  ];

  const totalPrice = bookingItems
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  const totalSavings = bookingItems
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + (item.originalPrice - item.price), 0);

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Booking Summary</h1>
          <p className="text-gray-600">Review and book your travel arrangements</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Items */}
          <div className="lg:col-span-2 space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Affiliate Disclosure: We may earn a commission from bookings made through our partner links.
                This helps us keep our service free while providing you with the best deals.
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
                              <Badge variant="outline" className="mb-1">
                                {item.type}
                              </Badge>
                              <p className="text-xs text-gray-500">via {item.provider}</p>
                            </div>
                          </div>
                          <CardTitle className="text-gray-900 mb-1">{item.title}</CardTitle>
                          <p className="text-sm text-gray-600">{item.details}</p>
                          <p className="text-sm text-gray-500 mt-1">{item.date}</p>

                          {/* Rating */}
                          <div className="flex items-center gap-2 mt-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                              <span className="text-sm text-gray-900">{item.rating}</span>
                            </div>
                            <span className="text-sm text-gray-500">({item.reviews} reviews)</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-500 line-through">${item.originalPrice}</div>
                        <div className="text-2xl text-gray-900">${item.price}</div>
                        <Badge className="mt-1 bg-green-100 text-green-800 border-0">
                          Save ${item.originalPrice - item.price}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <Separator className="mb-4" />

                    {/* Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {item.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="h-4 w-4 text-green-600" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* Amenities */}
                    {item.amenities && (
                      <div className="flex gap-4 mb-4">
                        {item.amenities.map((Amenity, i) => (
                          <div key={i} className="flex items-center gap-1 text-sm text-gray-600">
                            <Amenity className="h-4 w-4" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => window.open('#', '_blank')}
                      >
                        Book Now on {item.provider}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                      <Button variant="outline">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Alternative Options */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Alternative Options</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-4">
                  Want to explore other options? Our AI can find alternatives that match your preferences.
                </p>
                <Button variant="outline" className="w-full">
                  Find Alternatives
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Cart Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedItems.map((id) => {
                    const item = bookingItems.find((i) => i.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.type}</span>
                        <span className="text-gray-900">${item.price}</span>
                      </div>
                    );
                  })}

                  {selectedItems.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No items selected</p>
                  )}

                  {selectedItems.length > 0 && (
                    <>
                      <Separator />

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900">${totalPrice}</span>
                      </div>

                      <div className="flex justify-between text-sm text-green-600">
                        <span>Total Savings</span>
                        <span>-${totalSavings}</span>
                      </div>

                      <Separator />

                      <div className="flex justify-between">
                        <span className="text-gray-900">Total</span>
                        <span className="text-2xl text-gray-900">${totalPrice}</span>
                      </div>

                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        size="lg"
                      >
                        Proceed to Checkout
                      </Button>

                      <p className="text-xs text-gray-500 text-center">
                        You'll be redirected to our partners to complete your booking
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Price Match Guarantee */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-900">Price Match Guarantee</p>
                      <p className="text-xs text-green-700 mt-1">
                        We continuously monitor prices to ensure you get the best deal
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Back to Itinerary */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onNavigate('dashboard')}
              >
                ← Back to Itinerary
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
