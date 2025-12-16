import { motion } from 'motion/react';
import { Plane, Hotel, ExternalLink, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
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
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => onNavigate('dashboard')} className="mb-6 pl-0 hover:bg-white/10 text-slate-200 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="mb-10">
          <h1 className="text-5xl font-bold text-white mb-3 text-shadow">Booking Options</h1>
          <p className="text-xl text-slate-300">
            {tripData.origin 
              ? `Here are the cheapest flights from ${tripData.origin} to ${tripData.destination}`
              : `Real-time prices for ${tripData.destination}`}
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="space-y-8">
            
            <div>
              <h2 className="text-3xl font-bold gradient-text mb-6 flex items-center gap-3">
                <Plane className="h-7 w-7 text-blue-400" /> 
                {tripData.origin 
                  ? `${tripData.origin} → ${tripData.destination}`
                  : 'Outbound Flights'}
              </h2>
              <div className="space-y-5">
                {outboundFlights.map((flight, index) => {
                  const [showSegments, setShowSegments] = useState(false);
                  const hasSegments = flight.segments && flight.segments.length > 0;
                  
                  return (
                    <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ y: -4 }}>
                      <div className="card-glass border-l-4 border-l-blue-500 hover:shadow-2xl transition-all p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-bold text-xl text-white mb-2">{flight.airline}</h3>
                            <p className="text-sm text-slate-300 mb-3">
                                {flight.stops === 0 ? "✈️ Non-stop" : `${flight.stops} Stop(s)`} • 
                                {flight.duration_hours > 0 ? ` ${flight.duration_hours}h` : ""}
                                {flight.flight_type && ` • ${flight.flight_type}`}
                            </p>
                            <div className="flex gap-6 text-sm text-slate-200">
                                <span className="font-semibold">🛫 {flight.departure_time || "TBA"}</span>
                                <span className="font-semibold">🛬 {flight.arrival_time || "TBA"}</span>
                            </div>
                            
                            {hasSegments && (
                              <button
                                onClick={() => setShowSegments(!showSegments)}
                                className="mt-3 text-sm text-purple-400 hover:text-pink-400 font-semibold flex items-center gap-1 transition-colors"
                              >
                                {showSegments ? '▼' : '▶'} {showSegments ? 'Hide' : 'Show'} Flight Details
                              </button>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="block text-3xl font-bold gradient-text mb-3">
                                {flight.price_usd > 0 ? `$${flight.price_usd}` : "Check"}
                            </span>
                            <Button 
                              size="sm" 
                              className="btn-primary px-6"
                              onClick={() => window.open(flight.booking_url, '_blank')}
                            >
                              Book <ExternalLink className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                          
                          {hasSegments && showSegments && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-6 pt-6 border-t border-white/10"
                            >
                              <h4 className="text-sm font-bold text-slate-200 mb-4">Flight Segments</h4>
                              <div className="space-y-3">
                                {flight.segments.map((segment, segIdx) => (
                                  <div key={segIdx} className="flex items-center gap-3 glass-subtle p-4 rounded-xl">
                                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold text-white">
                                      {segment.leg}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                        <span className="font-mono">{segment.from}</span>
                                        <ArrowRight className="h-4 w-4 text-pink-400" />
                                        <span className="font-mono">{segment.to}</span>
                                      </div>
                                      <div className="text-xs text-slate-300 mt-1">
                                        {segment.airline} {segment.flight_number && `• ${segment.flight_number}`}
                                      </div>
                                      <div className="text-xs text-slate-400 mt-1">
                                        {segment.departure} → {segment.arrival}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* RETURN FLIGHTS */}
            <div>
              <h2 className="text-3xl font-bold gradient-text mb-6 flex items-center gap-3">
                <Plane className="h-7 w-7 text-green-400 rotate-180" /> 
                {tripData.origin 
                  ? `${tripData.destination} → ${tripData.origin}`
                  : 'Return Flights'}
              </h2>
              <div className="space-y-4">
                {returnFlights.map((flight, index) => {
                  const [showSegments, setShowSegments] = useState(false);
                  const hasSegments = flight.segments && flight.segments.length > 0;
                  
                  return (
                    <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ y: -4 }}>
                      <div className="card-glass border-l-4 border-l-green-500 hover:shadow-2xl transition-all p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-bold text-xl text-white mb-2">{flight.airline}</h3>
                            <p className="text-sm text-slate-300 mb-3">
                                {flight.stops === 0 ? "✈️ Non-stop" : `${flight.stops} Stop(s)`} • 
                                {flight.duration_hours > 0 ? ` ${flight.duration_hours}h` : ""}
                                {flight.flight_type && ` • ${flight.flight_type}`}
                            </p>
                            <div className="flex gap-6 text-sm text-slate-200">
                                <span className="font-semibold">🛫 {flight.departure_time || "TBA"}</span>
                                <span className="font-semibold">🛬 {flight.arrival_time || "TBA"}</span>
                            </div>
                            
                            {hasSegments && (
                              <button
                                onClick={() => setShowSegments(!showSegments)}
                                className="mt-3 text-sm text-purple-400 hover:text-pink-400 font-semibold flex items-center gap-1 transition-colors"
                              >
                                {showSegments ? '▼' : '▶'} {showSegments ? 'Hide' : 'Show'} Flight Details
                              </button>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="block text-3xl font-bold gradient-text mb-3">
                                {flight.price_usd > 0 ? `$${flight.price_usd}` : "Check"}
                            </span>
                            <Button 
                              size="sm" 
                              className="btn-primary px-6"
                              onClick={() => window.open(flight.booking_url, '_blank')}
                            >
                              Book <ExternalLink className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                          
                          {/* Detailed segments for connecting flights */}
                          {hasSegments && showSegments && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-6 pt-6 border-t border-white/10"
                            >
                              <h4 className="text-sm font-bold text-slate-200 mb-4">Flight Segments</h4>
                              <div className="space-y-3">
                                {flight.segments.map((segment, segIdx) => (
                                  <div key={segIdx} className="flex items-center gap-3 glass-subtle p-4 rounded-xl">
                                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold text-white">
                                      {segment.leg}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                        <span className="font-mono">{segment.from}</span>
                                        <ArrowRight className="h-4 w-4 text-pink-400" />
                                        <span className="font-mono">{segment.to}</span>
                                      </div>
                                      <div className="text-xs text-slate-300 mt-1">
                                        {segment.airline} {segment.flight_number && `• ${segment.flight_number}`}
                                      </div>
                                      <div className="text-xs text-slate-400 mt-1">
                                        {segment.departure} → {segment.arrival}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* HOTELS */}
            <div>
              <h2 className="text-3xl font-bold gradient-text mb-6 flex items-center gap-3">
                <Hotel className="h-7 w-7 text-purple-400" /> Hotels in {tripData.destination}
              </h2>
              {tripData.start_date && tripData.end_date && (
                <p className="text-slate-300 mb-4 -mt-2">
                  Here are the cheapest hotels currently in {tripData.destination} 
                  {tripData.start_date && ` from ${new Date(tripData.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  {tripData.end_date && ` to ${new Date(tripData.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                </p>
              )}
              <div className="space-y-4">

                {hotelList.map((hotel, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ y: -4 }}>
            <div 
              className="card-glass border-l-4 border-l-purple-500 hover:shadow-2xl transition-all p-6 cursor-pointer"
              onClick={() => {
                if (hotel.booking_url && hotel.booking_url.trim()) {
                  window.open(hotel.booking_url, '_blank');
                } else {
                  alert('Booking URL not available for this hotel.');
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-white mb-2">{hotel.name}</h3>
                  <div className="flex items-center gap-1 my-2">
                      <Star className="h-5 w-5 text-orange-400 fill-orange-400" />
                      <span className="text-sm font-semibold text-slate-200">{hotel.rating > 0 ? hotel.rating : "N/A"}</span>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-2 mb-2">{hotel.summary}</p>
                  <p className="text-xs text-slate-400 mt-1">{hotel.address}</p>
                </div>
                <div className="text-right ml-4">
                  <span className="block text-3xl font-bold gradient-text mb-3">
                      {hotel.price_per_night_usd > 0 ? `$${hotel.price_per_night_usd}` : "Check"}
                  </span>
                  <Button
                    size="sm"
                    className="btn-primary px-6 mt-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hotel.booking_url && hotel.booking_url.trim()) {
                        window.open(hotel.booking_url, '_blank');
                      } else {
                        alert('Booking URL not available for this hotel.');
                      }
                    }}
                  >
                    View Deal <ExternalLink className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}