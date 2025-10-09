import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Sparkles, MapPin, Calendar, DollarSign, Users, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface ChatInterfaceProps {
  onGenerateItinerary: (preferences: any) => void;
}

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  tags?: Array<{ icon: any; label: string; value: string }>;
}

export function ChatInterface({ onGenerateItinerary }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI travel assistant. Tell me about your dream trip and I'll create a personalized itinerary for you. Where would you like to go?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    'Romantic Paris getaway for 2, under $2000',
    'Family beach vacation in Bali',
    'Adventure trip to New Zealand',
    'Cultural tour of Japan in spring',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleSend = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLoadingProgress(0);

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "Great choice! I've analyzed your preferences. Here's what I understood:",
        tags: [
          { icon: MapPin, label: 'Destination', value: 'Paris, France' },
          { icon: Users, label: 'Travelers', value: '2 Adults' },
          { icon: DollarSign, label: 'Budget', value: '$2,000' },
          { icon: Calendar, label: 'Duration', value: '5-7 days' },
        ],
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);

      setTimeout(() => {
        const confirmMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'system',
          content: 'Ready to generate your itinerary?',
        };
        setMessages((prev) => [...prev, confirmMessage]);
      }, 1000);
    }, 3000);
  };

  const handleGenerateItinerary = () => {
    onGenerateItinerary({
      destination: 'Paris, France',
      travelers: 2,
      budget: 2000,
      duration: 7,
      preferences: ['romantic', 'cultural'],
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-white">AI Travel Assistant</h2>
              <p className="text-blue-100 text-sm">Powered by Multi-Agent AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {message.type === 'user' ? (
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-md">
                    <p>{message.content}</p>
                  </div>
                </div>
              ) : message.type === 'system' ? (
                <div className="flex justify-center">
                  <Card className="max-w-md">
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-700 mb-4">{message.content}</p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={handleGenerateItinerary}
                        >
                          Generate Itinerary
                        </Button>
                        <Button variant="outline">
                          Adjust Preferences
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-md shadow-sm border border-gray-200">
                    <p className="text-gray-800">{message.content}</p>
                    {message.tags && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {message.tags.map((tag, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 bg-gray-50 rounded-lg p-2"
                          >
                            <tag.icon className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500">{tag.label}</p>
                              <p className="text-sm text-gray-900">{tag.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <Card className="max-w-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-gray-700">Analyzing your preferences...</span>
                  </div>
                  <Progress value={loadingProgress} className="h-2" />
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    <p>🔍 Research Agent: Gathering destination data...</p>
                    <p>🤖 NLP Engine: Understanding preferences...</p>
                    <p>⚡ ML Model: Generating recommendations...</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Suggestion Chips */}
          {messages.length === 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 px-3 py-1"
                  onClick={() => handleSend(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          )}

          {/* Input Field */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe your trip: e.g., 'Romantic Paris getaway for 2, under $2000'"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              size="icon"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-2 text-center">
            Powered by NLP for understanding, RL for optimization, and ML for recommendations
          </p>
        </div>
      </div>
    </div>
  );
}
