import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { ChatInterface } from './components/ChatInterface';
import { ItineraryDashboard } from './components/ItineraryDashboard';
import { BookingSimulation } from './components/BookingSimulation';
import { ProfileSettings } from './components/ProfileSettings';
import { CollaborativeMode } from './components/CollaborativeMode';
import { Toaster } from './components/ui/sonner';
// 1. Import the shared type so TypeScript knows what the data looks like
import { FinalItinerary } from './types';

type Screen = 'home' | 'chat' | 'dashboard' | 'booking' | 'profile' | 'collaborative';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  
  // 2. Add State to hold the AI Response
  const [tripData, setTripData] = useState<FinalItinerary | null>(null);

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 3. Update the handler to receive real data from ChatInterface
  const handleItineraryGenerated = (data: FinalItinerary) => {
    console.log("✅ App received itinerary data:", data);
    setTripData(data); // Save it to state
    handleNavigate('dashboard'); // Switch screen
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation onNavigate={handleNavigate} currentScreen={currentScreen} />
      
      <main className="flex-1">
        {currentScreen === 'home' && <LandingPage onNavigate={handleNavigate} />}
        
        {/* 4. Pass the new handler to Chat */}
        {currentScreen === 'chat' && (
          <ChatInterface onGenerateItinerary={handleItineraryGenerated} />
        )}
        
        {/* 5. Pass the tripData to Dashboard */}
        {currentScreen === 'dashboard' && (
          <ItineraryDashboard 
            onNavigate={handleNavigate} 
            tripData={tripData} 
          />
        )}
        
        {/* 6. Pass the tripData to Booking */}
        {currentScreen === 'booking' && (
          <BookingSimulation 
            onNavigate={handleNavigate} 
            tripData={tripData}
          />
        )}
        
        {currentScreen === 'profile' && (
          <ProfileSettings onNavigate={handleNavigate} />
        )}
        
        {currentScreen === 'collaborative' && <CollaborativeMode />}
      </main>

      {currentScreen === 'home' && <Footer />}
      
      <Toaster />
    </div>
  );
}