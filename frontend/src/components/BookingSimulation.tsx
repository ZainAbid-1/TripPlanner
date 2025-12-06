import { motion } from 'motion/react';
import { Plane, Hotel, ExternalLink, Star, Info, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { FinalItinerary } from '../types';
import { useState } from 'react';

interface BookingSimulationProps {
  onNavigate: (screen: string) => void;
  tripData: FinalItinerary | null;
}

export function BookingSimulation({ onNavigate, tripData }: BookingSimulationProps) {
  
  if (!tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No booking data found.</p>
        <Button onClick={() => onNavigate('chat')}>Back to Chat</Button>
      </div>
    );
  }

  // Use separate outbound and return flight lists
  const outboundFlights = tripData.all_outbound_flights?.length > 0 
    ? tripData.all_outbound_flights 
    : (tripData.chosen_outbound_flight ? [tripData.chosen_outbound_flight] : []);
  
  const returnFlights = tripData.all_return_flights?.length > 0 
    ? tripData.all_return_flights 
    : (tripData.chosen_return_flight ? [tripData.chosen_return_flight] : []);
  
  const hotelList = tripData.all_hotels?.length > 0 ? tripData.all_hotels : [tripData.chosen_hotel];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => onNavigate('dashboard')} className="mb-4 pl-0 hover:bg-transparent hover:text-blue-600">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Options</h1>
          <p className="text-gray-600">Real-time options for {tripData.destination}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-8">
            
            {/* OUTBOUND FLIGHTS */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Plane className="h-5 w-5 text-blue-600" /> Outbound Flights
              </h2>
              <div className="space-y-4">
                {outboundFlights.map((flight, index) => {
                  const [showSegments, setShowSegments] = useState(false);
                  const hasSegments = flight.segments && flight.segments.length > 0;
                  
                  return (
                    <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                      <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-900">{flight.airline}</h3>
                              <p className="text-sm text-gray-500">
                                  {flight.stops === 0 ? "Non-stop" : `${flight.stops} Stop(s)`} • 
                                  {flight.duration_hours > 0 ? ` ${flight.duration_hours}h` : ""}
                                  {flight.flight_type && ` • ${flight.flight_type}`}
                              </p>
                              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                  <span>Dep: {flight.departure_time || "TBA"}</span>
                                  <span>Arr: {flight.arrival_time || "TBA"}</span>
                              </div>
                              
                              {hasSegments && (
                                <button
                                  onClick={() => setShowSegments(!showSegments)}
                                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                >
                                  {showSegments ? '▼' : '▶'} {showSegments ? 'Hide' : 'Show'} Flight Details
                                </button>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="block text-2xl font-bold text-gray-900">
                                  {flight.price_usd > 0 ? `$${flight.price_usd}` : "Check Price"}
                              </span>
                              <Button 
                                size="sm" 
                                className="mt-2 bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={() => window.open(flight.booking_url, '_blank')}
                              >
                                Book on Google <ExternalLink className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {hasSegments && showSegments && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-4 pt-4 border-t border-gray-200"
                            >
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Flight Segments</h4>
                              <div className="space-y-3">
                                {flight.segments.map((segment, segIdx) => (
                                  <div key={segIdx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                                    <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
                                      {segment.leg}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                        <span className="font-mono">{segment.from}</span>
                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                        <span className="font-mono">{segment.to}</span>
                                      </div>
                                      <div className="text-xs text-gray-600 mt-1">
                                        {segment.airline} {segment.flight_number && `• ${segment.flight_number}`}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {segment.departure} → {segment.arrival}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* RETURN FLIGHTS */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Plane className="h-5 w-5 text-green-600 rotate-180" /> Return Flights
              </h2>
              <div className="space-y-4">
                {returnFlights.map((flight, index) => {
                  const [showSegments, setShowSegments] = useState(false);
                  const hasSegments = flight.segments && flight.segments.length > 0;
                  
                  return (
                    <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                      <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-900">{flight.airline}</h3>
                              <p className="text-sm text-gray-500">
                                  {flight.stops === 0 ? "Non-stop" : `${flight.stops} Stop(s)`} • 
                                  {flight.duration_hours > 0 ? ` ${flight.duration_hours}h` : ""}
                                  {flight.flight_type && ` • ${flight.flight_type}`}
                              </p>
                              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                  <span>Dep: {flight.departure_time || "TBA"}</span>
                                  <span>Arr: {flight.arrival_time || "TBA"}</span>
                              </div>
                              
                              {/* Show segments toggle for connecting flights */}
                              {hasSegments && (
                                <button
                                  onClick={() => setShowSegments(!showSegments)}
                                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                >
                                  {showSegments ? '▼' : '▶'} {showSegments ? 'Hide' : 'Show'} Flight Details
                                </button>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="block text-2xl font-bold text-gray-900">
                                  {flight.price_usd > 0 ? `$${flight.price_usd}` : "Check Price"}
                              </span>
                              <Button 
                                size="sm" 
                                className="mt-2 bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={() => window.open(flight.booking_url, '_blank')}
                              >
                                Book on Google <ExternalLink className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Detailed segments for connecting flights */}
                          {hasSegments && showSegments && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-4 pt-4 border-t border-gray-200"
                            >
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Flight Segments</h4>
                              <div className="space-y-3">
                                {flight.segments.map((segment, segIdx) => (
                                  <div key={segIdx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                                    <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
                                      {segment.leg}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                        <span className="font-mono">{segment.from}</span>
                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                        <span className="font-mono">{segment.to}</span>
                                      </div>
                                      <div className="text-xs text-gray-600 mt-1">
                                        {segment.airline} {segment.flight_number && `• ${segment.flight_number}`}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {segment.departure} → {segment.arrival}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* HOTELS */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Hotel className="h-5 w-5 text-purple-600" /> Hotel Options
              </h2>
              <div className="space-y-4">

                {hotelList.map((hotel, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card 
              className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                if (hotel.booking_url && hotel.booking_url.trim()) {
                  window.open(hotel.booking_url, '_blank');
                } else {
                  alert('Booking URL not available for this hotel.');
                }
              }}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{hotel.name}</h3>
                    <div className="flex items-center gap-1 my-1">
                        <Star className="h-4 w-4 text-orange-400 fill-orange-400" />
                        <span className="text-sm font-medium">{hotel.rating > 0 ? hotel.rating : "N/A"}</span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{hotel.summary}</p>
                    <p className="text-xs text-gray-400 mt-1">{hotel.address}</p>
                  </div>
                  <div className="text-right ml-4">
                    <span className="block text-2xl font-bold text-gray-900">
                        {hotel.price_per_night_usd > 0 ? `$${hotel.price_per_night_usd}` : "Check Price"}
                        <span className="text-sm font-normal text-gray-500">/night</span>
                    </span>
                    <Button
                      size="sm"
                      className="mt-2 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click when button is clicked
                        if (hotel.booking_url && hotel.booking_url.trim()) {
                          window.open(hotel.booking_url, '_blank');
                        } else {
                          alert('Booking URL not available for this hotel.');
                        }
                      }}
                    >
                      View Deal <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
              </div>
            </div>

          </div>

          {/* SUMMARY SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Trip Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-800">Outbound Flight</span>
                    <span className="font-bold">${tripData.chosen_outbound_flight?.price_usd || tripData.chosen_flight?.price_usd || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-800">Return Flight</span>
                    <span className="font-bold">${tripData.chosen_return_flight?.price_usd || tripData.chosen_flight?.price_usd || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-800">Hotel Est. (3 nights)</span>
                    <span className="font-bold">${(tripData.chosen_hotel?.price_per_night_usd || 0) * 3}</span>
                  </div>
                  <Separator className="bg-blue-200" />
                  <div className="flex justify-between text-lg font-bold text-blue-900">
                    <span>Est. Total</span>
                    <span>${tripData.total_estimated_cost || 0}</span>
                  </div>
                  <Alert className="bg-white/50 border-blue-200 mt-4">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-xs text-blue-800 ml-2">
                      Prices change frequently. Click "Book Now" to see live availability.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}