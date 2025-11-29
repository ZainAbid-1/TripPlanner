// src/App.tsx
import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import { ChatInterface } from './components/ChatInterface';
import { ItineraryDashboard } from './components/ItineraryDashboard';
import { BookingSimulation } from './components/BookingSimulation';
import { CollaborativeMode } from './components/CollaborativeMode';
import { ProfileSettings } from './components/ProfileSettings';
import { Footer } from './components/Footer';
import { FinalItinerary } from './types';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  
  // 🔴 FIX: Initialize with null, NOT mock data. 
  // If you had mock data here like "useState(mockParis)", delete it.
  const [tripData, setTripData] = useState<FinalItinerary | null>(null);

  const handleGenerateItinerary = (data: FinalItinerary) => {
    console.log("📲 App received REAL data:", data); // Check console to verify
    setTripData(data);
    setCurrentScreen('dashboard'); // Auto-navigate to dashboard
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <LandingPage onNavigate={setCurrentScreen} />;
      case 'chat':
        return <ChatInterface onGenerateItinerary={handleGenerateItinerary} />;
      case 'dashboard':
        return <ItineraryDashboard onNavigate={setCurrentScreen} tripData={tripData} />;
      case 'booking':
        return <BookingSimulation onNavigate={setCurrentScreen} tripData={tripData} />;
      case 'collab':
        return <CollaborativeMode />;
      case 'profile':
        return <ProfileSettings onNavigate={setCurrentScreen} />;
      default:
        return <LandingPage onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navigation onNavigate={setCurrentScreen} currentScreen={currentScreen} />
      <main className="flex-grow">
        {renderScreen()}
      </main>
      <Footer />
    </div>
  );
}

export default App;