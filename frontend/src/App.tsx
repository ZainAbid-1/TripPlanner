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
  // State for Navigation
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  
  // State for Data (The Itinerary from Backend)
  const [tripData, setTripData] = useState<FinalItinerary | null>(null);

  // Callback when AI finishes generating the trip
  const handleItineraryGenerated = (data: FinalItinerary) => {
    setTripData(data);
    setCurrentScreen('dashboard'); // Auto-redirect to dashboard
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <LandingPage onNavigate={setCurrentScreen} />;
      case 'chat':
        return <ChatInterface onGenerateItinerary={handleItineraryGenerated} />;
      case 'dashboard':
        return <ItineraryDashboard onNavigate={setCurrentScreen} tripData={tripData} />;
      case 'booking':
        return <BookingSimulation onNavigate={setCurrentScreen} tripData={tripData} />;
      case 'collaborate':
        return <CollaborativeMode />; // You can pass tripData here too if needed
      case 'profile':
        return <ProfileSettings onNavigate={setCurrentScreen} />;
      default:
        return <LandingPage onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation onNavigate={setCurrentScreen} currentScreen={currentScreen} />
      
      <main className="flex-grow">
        {renderScreen()}
      </main>

      <Footer />
    </div>
  );
}

export default App;