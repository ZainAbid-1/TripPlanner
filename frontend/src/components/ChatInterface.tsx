import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Send, 
  Sparkles, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Loader2, 
  AlertCircle, 
  Info 
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { FinalItinerary } from '../types';

interface ChatInterfaceProps {
  onGenerateItinerary: (data: FinalItinerary) => void;
}

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system' | 'error';
  content: string;
  tags?: Array<{ icon: any; label: string; value: string }>;
}

export function ChatInterface({ onGenerateItinerary }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI travel assistant. Where do you want to go? \n\n(e.g., 'Trip to Dubai from London next month for 2 people, budget $3000')",
    },
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // 🧠 MEMORY: Stores the partial query if validation fails
  const [accumulatedContext, setAccumulatedContext] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + 2;
        });
      }, 800);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(0);
    }
  }, [isLoading]);

  const handleSend = async (text?: string) => {
    const userText = text || input;
    if (!userText.trim() || isLoading) return;

    // 1. Add User Message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userText,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLoadingProgress(10);

    // 2. Combine with previous context if we were waiting for info
    const fullQuery = accumulatedContext ? `${accumulatedContext} ${userText}` : userText;

    try {
      const response = await fetch('http://localhost:8000/api/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fullQuery }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 🛑 VALIDATION ERROR (Missing Fields)
        if (response.status === 400 || data.detail?.includes("VALIDATION:")) {
           // 1. Save the current query so we don't lose it
           setAccumulatedContext(fullQuery);
           
           // 2. Remove the "VALIDATION:" prefix if it exists in the string
           const cleanError = data.detail.replace("VALIDATION:", "").trim();
           throw new Error("VALIDATION:" + cleanError);
        } else {
           throw new Error(data.detail || 'Failed to generate itinerary. Please try again.');
        }
      }

      // ✅ SUCCESS
      setAccumulatedContext(''); // Clear memory
      const itineraryData = data as FinalItinerary;

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I've created your personalized itinerary for ${itineraryData.destination}!`,
        tags: [
          { icon: MapPin, label: 'Destination', value: itineraryData.destination },
          { icon: DollarSign, label: 'Budget Info', value: "Calculated" }, 
          { icon: Calendar, label: 'Duration', value: `${itineraryData.daily_plans.length} Days` },
        ],
      };
      setMessages((prev) => [...prev, aiResponse]);
      setLoadingProgress(100);
      
      setTimeout(() => {
          onGenerateItinerary(itineraryData);
      }, 1500);

    } catch (error: any) {
      let msgType: 'error' | 'system' = 'error';
      let content = error.message || "Something went wrong.";

      if (content.startsWith("VALIDATION:")) {
          msgType = 'system';
          content = content.replace("VALIDATION:", "");
          // We DO NOT clear accumulatedContext here so user can append to it
      } else {
          // Real error? Clear context to start fresh
          setAccumulatedContext('');
      }

      const responseMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: msgType,
        content: content,
      };
      setMessages((prev) => [...prev, responseMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    'Trip to Paris from New York, 5 days, $3000',
    'Weekend in Dubai from Riyadh for 2 adults',
    'Budget backpacking in Thailand for 2 weeks',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">AI Travel Assistant</h2>
              <p className="text-blue-100 text-sm">Powered by Multi-Agent AI</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {message.type === 'user' && (
                <div className="flex justify-end">
                  {/* USER MESSAGE: Wider container (up to 80%) */}
                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-6 py-4 max-w-[90%] md:max-w-[80%] shadow-md">
                    <p className="text-base leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              )}

              {message.type === 'ai' && (
                <div className="flex justify-start">
                   {/* AI MESSAGE: Wider container (up to 80%) */}
                  <div className="bg-white rounded-2xl rounded-tl-sm px-6 py-4 max-w-[90%] md:max-w-[80%] shadow-sm border border-gray-200">
                    <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                    {message.tags && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        {message.tags.map((tag, index) => (
                          <div key={index} className="flex items-center gap-3 bg-blue-50 rounded-xl p-3 border border-blue-100">
                            <tag.icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div className="overflow-hidden">
                              <p className="text-[11px] uppercase font-bold text-gray-500">{tag.label}</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">{tag.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SYSTEM MESSAGE (Validation Request) */}
              {message.type === 'system' && (
                <div className="flex justify-start">
                   {/* SYSTEM MESSAGE: Wider, distinct color */}
                  <div className="bg-orange-50 text-orange-900 rounded-2xl rounded-tl-sm px-6 py-4 max-w-[90%] md:max-w-[80%] shadow-sm border border-orange-200 flex flex-col sm:flex-row items-start gap-4">
                     <div className="mt-1 flex-shrink-0 bg-orange-100 p-2 rounded-full">
                        <Info className="h-6 w-6 text-orange-600" />
                     </div>
                     <div className="w-full">
                       <p className="font-bold text-base mb-2 text-orange-800">I need a few more details to plan this perfectly:</p>
                       <div className="text-base leading-relaxed whitespace-pre-wrap break-words">
                         {message.content}
                       </div>
                     </div>
                  </div>
                </div>
              )}

              {message.type === 'error' && (
                <div className="flex justify-center my-4">
                   <div className="bg-red-50 text-red-800 rounded-lg px-6 py-4 max-w-[90%] border border-red-200 flex items-center gap-3 shadow-sm">
                      <AlertCircle className="h-6 w-6 flex-shrink-0" />
                      <p className="text-sm font-medium">{message.content}</p>
                   </div>
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <Card className="w-full max-w-sm border-blue-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-gray-700 font-medium text-sm">
                        {accumulatedContext ? "Updating plan with new info..." : "Analyzing your request..."}
                    </span>
                  </div>
                  <Progress value={loadingProgress} className="h-2 bg-blue-100" />
                </CardContent>
              </Card>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-4 shadow-lg z-10">
        <div className="max-w-5xl mx-auto">
          {messages.length < 3 && !isLoading && !accumulatedContext && (
            <div className="mb-4 flex flex-wrap gap-2 justify-center md:justify-start">
              {suggestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-blue-100 hover:text-blue-700 px-4 py-2 text-sm transition-colors border border-gray-200"
                  onClick={() => handleSend(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={accumulatedContext ? "Type the missing info (e.g. 'From London', '$2000')..." : "Describe your trip (Destination, Origin, Budget, Dates)..."}
              className="flex-1 rounded-xl border border-gray-300 px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl px-8 shadow-md transition-all h-auto"
              size="lg"
            >
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}