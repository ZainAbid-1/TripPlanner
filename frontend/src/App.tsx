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

type Screen = 'home' | 'chat' | 'dashboard' | 'booking' | 'profile' | 'collaborative';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateItinerary = (preferences: any) => {
    // Simulate itinerary generation
    setTimeout(() => {
      setCurrentScreen('dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation onNavigate={handleNavigate} currentScreen={currentScreen} />
      
      <main className="flex-1">
        {currentScreen === 'home' && <LandingPage onNavigate={handleNavigate} />}
        {currentScreen === 'chat' && (
          <ChatInterface onGenerateItinerary={handleGenerateItinerary} />
        )}
        {currentScreen === 'dashboard' && (
          <ItineraryDashboard onNavigate={handleNavigate} />
        )}
        {currentScreen === 'booking' && (
          <BookingSimulation onNavigate={handleNavigate} />
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
