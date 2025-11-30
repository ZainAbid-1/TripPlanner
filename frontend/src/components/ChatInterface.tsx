import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Send, Sparkles, MapPin, Calendar, DollarSign, Loader2, AlertCircle, Info 
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
      content: "Hi! I'm your AI travel assistant. Where do you want to go?",
    },
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [accumulatedContext, setAccumulatedContext] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  // Fake progress bar animation
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => (prev >= 90 ? 90 : prev + 2));
      }, 800);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(0);
    }
  }, [isLoading]);

  const handleSend = async (text?: string) => {
    const userText = text || input;
    if (!userText.trim() || isLoading) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentRequestRef.current = requestId;

    // 1. Add User Message
    setMessages((prev) => [...prev, { id: Date.now().toString(), type: 'user', content: userText }]);
    setInput('');
    setIsLoading(true);
    setLoadingProgress(10);

    const fullQuery = accumulatedContext ? `${accumulatedContext} ${userText}` : userText;

    try {
      // 2. Call API
      const response = await fetch('http://localhost:8000/api/plan-trip', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Request-ID': requestId
        },
        body: JSON.stringify({ query: fullQuery }),
      });

      if (currentRequestRef.current !== requestId) {
        console.log(`Ignoring stale response for request ${requestId}`);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 || data.detail?.includes("VALIDATION:")) {
           setAccumulatedContext(fullQuery);
           const cleanError = data.detail.replace("VALIDATION:", "").trim();
           throw new Error("VALIDATION:" + cleanError);
        } else {
           throw new Error(data.detail || 'Failed to generate itinerary.');
        }
      }

      if (currentRequestRef.current !== requestId) {
        console.log(`Ignoring stale response for request ${requestId} (after validation)`);
        return;
      }

      // 3. Success Handling
      setAccumulatedContext(''); 
      const itineraryData = data as FinalItinerary;

      // Add AI Success Message
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I've created your personalized itinerary for ${itineraryData.destination}!`,
        tags: [
          { icon: MapPin, label: 'Destination', value: itineraryData.destination },
          { icon: DollarSign, label: 'Budget', value: `$${itineraryData.total_estimated_cost || 0}` }, 
          { icon: Calendar, label: 'Duration', value: `${itineraryData.daily_plans.length} Days` },
        ],
      }]);
      setLoadingProgress(100);
      
      // 🚀 CRITICAL: PASS DATA TO APP.TSX
      console.log(`[${requestId}] Passing data to parent:`, itineraryData);
      
      timeoutRef.current = setTimeout(() => {
        if (currentRequestRef.current === requestId) {
          onGenerateItinerary(itineraryData);
        } else {
          console.log(`Ignoring timeout for stale request ${requestId}`);
        }
      }, 1500);

    } catch (error: any) {
      let msgType: 'error' | 'system' = 'error';
      let content = error.message || "Something went wrong.";

      if (content.startsWith("VALIDATION:")) {
          msgType = 'system';
          content = content.replace("VALIDATION:", "");
      } else {
          setAccumulatedContext('');
      }

      setMessages((prev) => [...prev, { id: (Date.now() + 2).toString(), type: msgType, content: content }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[80%] rounded-2xl px-6 py-4 shadow-sm
                ${message.type === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 
                  message.type === 'system' ? 'bg-orange-50 text-orange-900 border border-orange-200' :
                  message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                  'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'}
              `}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.tags && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {message.tags.map((tag, i) => (
                      <div key={i} className="bg-gray-50 p-2 rounded border border-gray-100 flex items-center gap-2">
                        <tag.icon className="h-4 w-4 text-blue-500" />
                        <div className="overflow-hidden">
                            <div className="text-[10px] text-gray-400 uppercase font-bold">{tag.label}</div>
                            <div className="text-xs font-bold truncate">{tag.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
             <div className="max-w-md bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="animate-spin text-blue-600 h-5 w-5" />
                    <span className="text-sm font-medium text-gray-600">Planning your trip...</span>
                </div>
                <Progress value={loadingProgress} className="h-1" />
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            className="flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your trip..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <Button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="bg-blue-600 h-auto px-6 rounded-xl">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}