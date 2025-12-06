import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Send, Sparkles, MapPin, Calendar, DollarSign, Loader2, AlertCircle, Info, Users 
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { FinalItinerary } from '../types';
import { AgentStatusCards } from './AgentStatusCards';

interface ChatInterfaceProps {
  onGenerateItinerary: (data: FinalItinerary) => void;
}

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system' | 'error' | 'form';
  content: string;
  tags?: Array<{ icon: any; label: string; value: string }>;
  missingInfo?: any;
  originalQuery?: string;
}

export function ChatInterface({ onGenerateItinerary }: ChatInterfaceProps) {
  const [showQuickForm, setShowQuickForm] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Welcome! Let's plan your perfect trip together. You can either fill out the quick form below or just tell me about your travel plans in your own words.",
    },
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [accumulatedContext, setAccumulatedContext] = useState('');
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  // Fake progress bar animation and stage progression
  useEffect(() => {
    if (isLoading) {
      setCurrentStage(1);
      
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => (prev >= 90 ? 90 : prev + 2));
      }, 800);
      
      // Simulate stage progression
      const stage2 = setTimeout(() => setCurrentStage(2), 3000);
      const stage3 = setTimeout(() => setCurrentStage(3), 6000);
      const stage4 = setTimeout(() => setCurrentStage(4), 9000);
      
      return () => {
        clearInterval(progressInterval);
        clearTimeout(stage2);
        clearTimeout(stage3);
        clearTimeout(stage4);
      };
    } else {
      setLoadingProgress(0);
      setCurrentStage(0);
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
        body: JSON.stringify({ 
          query: fullQuery,
          ask_if_missing: true,
          additional_answers: Object.keys(formAnswers).length > 0 ? formAnswers : null
        }),
      });

      if (currentRequestRef.current !== requestId) {
        console.log(`Ignoring stale response for request ${requestId}`);
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Received invalid response from server. Please try again.');
      }

      if (!response.ok) {
        if (response.status === 400 || data.detail?.includes("VALIDATION:")) {
           setAccumulatedContext(fullQuery);
           const cleanError = data.detail.replace("VALIDATION:", "").trim();
           throw new Error("VALIDATION:" + cleanError);
        } else if (response.status === 422) {
           const errorMsg = typeof data.detail === 'string' 
             ? data.detail 
             : JSON.stringify(data.detail);
           throw new Error(`Validation error: ${errorMsg}`);
        } else {
           throw new Error(data.detail || 'Failed to generate itinerary.');
        }
      }

      if (currentRequestRef.current !== requestId) {
        console.log(`Ignoring stale response for request ${requestId} (after validation)`);
        return;
      }

      // 2.5. Check if we need more information
      if (data.status === 'needs_more_info') {
        console.log('Backend requesting more information', data.missing_info);
        setFormAnswers({}); // Reset form answers
        setPendingQuery(data.original_query);
        
        // Count required fields
        const requiredCount = Object.values(data.missing_info).filter((info: any) => info.required).length;
        const totalCount = Object.keys(data.missing_info).length;
        
        let conversationalMessage = "Great! I need a few more details to create the perfect itinerary for you. ";
        if (requiredCount === totalCount) {
          conversationalMessage += `Please provide the following ${requiredCount} details:`;
        } else {
          conversationalMessage += `I need ${requiredCount} required details, and ${totalCount - requiredCount} optional ones that will help me personalize your trip:`;
        }
        
        // Add form message to chat
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          type: 'form',
          content: conversationalMessage,
          missingInfo: data.missing_info,
          originalQuery: data.original_query
        }]);
        
        setIsLoading(false);
        return;
      }

      // 3. Success Handling
      setAccumulatedContext('');
      setFormAnswers({}); // Reset form answers after success
      setPendingQuery(null);
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
      let content: string;

      if (typeof error === 'object' && error !== null) {
        content = error.message || JSON.stringify(error);
      } else if (typeof error === 'string') {
        content = error;
      } else {
        content = "Something went wrong. Please try again.";
      }

      if (content.startsWith("VALIDATION:")) {
          msgType = 'system';
          content = content.replace("VALIDATION:", "").trim();
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

  const [quickFormData, setQuickFormData] = useState({
    destination: '',
    origin: '',
    start_date: '',
    duration: '',
    travelers: '',
    budget_usd: ''
  });

  const handleQuickFormSubmit = () => {
    const parts = [];
    if (quickFormData.destination) parts.push(`to ${quickFormData.destination}`);
    if (quickFormData.origin) parts.push(`from ${quickFormData.origin}`);
    if (quickFormData.start_date) parts.push(`on ${quickFormData.start_date}`);
    if (quickFormData.duration) parts.push(`for ${quickFormData.duration} days`);
    if (quickFormData.travelers) parts.push(`for ${quickFormData.travelers} travelers`);
    if (quickFormData.budget_usd) parts.push(`budget $${quickFormData.budget_usd}`);
    
    const query = `Plan a trip ${parts.join(' ')}`;
    setShowQuickForm(false);
    handleSend(query);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {showQuickForm && messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border-2 border-blue-400/40 backdrop-blur-sm overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Sparkles className="h-6 w-6" />
                  Quick Trip Planner
                </h2>
                <button 
                  onClick={() => setShowQuickForm(false)}
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  Skip this form
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Destination
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Paris, Dubai, Tokyo"
                    value={quickFormData.destination}
                    onChange={(e) => setQuickFormData({...quickFormData, destination: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all backdrop-blur-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> From (Origin)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., New York, London"
                    value={quickFormData.origin}
                    onChange={(e) => setQuickFormData({...quickFormData, origin: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all backdrop-blur-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Start Date
                  </label>
                  <input
                    type="date"
                    value={quickFormData.start_date}
                    onChange={(e) => setQuickFormData({...quickFormData, start_date: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all backdrop-blur-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Duration (days)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 3, 5, 7"
                    value={quickFormData.duration}
                    onChange={(e) => setQuickFormData({...quickFormData, duration: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all backdrop-blur-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Number of Travelers
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 1, 2, 4"
                    value={quickFormData.travelers}
                    onChange={(e) => setQuickFormData({...quickFormData, travelers: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all backdrop-blur-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Budget (USD)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 1000, 2500"
                    value={quickFormData.budget_usd}
                    onChange={(e) => setQuickFormData({...quickFormData, budget_usd: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all backdrop-blur-sm"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleQuickFormSubmit}
                disabled={!quickFormData.destination}
                className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Generate My Itinerary
              </Button>
            </motion.div>
          )}
          
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.3,
                delay: index === messages.length - 1 ? 0 : 0
              }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <motion.div 
                whileHover={{ scale: message.type === 'form' ? 1 : 1.01 }}
                className={`
                  max-w-[80%] rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm
                  ${message.type === 'user' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-tr-sm' : 
                    message.type === 'system' ? 'bg-orange-500/20 text-orange-100 border border-orange-400/30 backdrop-blur-md' :
                    message.type === 'error' ? 'bg-red-500/20 text-red-100 border border-red-400/30 backdrop-blur-md' :
                    message.type === 'form' ? 'bg-gradient-to-br from-purple-900/40 to-blue-900/40 text-white border-2 border-purple-400/30 max-w-full backdrop-blur-md' :
                    'bg-slate-800/60 text-gray-100 border border-slate-600/30 rounded-tl-sm backdrop-blur-md'}
                `}
              >
                <p className="whitespace-pre-wrap font-semibold flex items-center gap-2">
                  {message.type === 'form' && <Info className="h-5 w-5 text-purple-600" />}
                  {message.content}
                </p>
                
                {/* Render form inputs for missing info */}
                {message.type === 'form' && message.missingInfo && (
                  <div className="mt-6 space-y-4 bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                    {Object.entries(message.missingInfo)
                      // Sort by priority (lower number = higher priority)
                      .sort(([, a]: [string, any], [, b]: [string, any]) => (a.priority || 999) - (b.priority || 999))
                      .map(([key, info]: [string, any]) => (
                      <div key={key} className="space-y-2">
                        <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                          {info.question}
                          {info.required ? (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">Optional</Badge>
                          )}
                        </label>
                        {info.hint && (
                          <p className="text-xs text-slate-400 -mt-1">{info.hint}</p>
                        )}
                        <input
                          type={info.type === 'number' ? 'number' : 'text'}
                          placeholder={info.hint || (info.default ? `Default: ${info.default}` : '')}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 focus:bg-slate-700/70 transition-all backdrop-blur-sm"
                          onChange={(e) => {
                            const value = e.target.value.trim();
                            setFormAnswers(prev => {
                              const updated = { ...prev };
                              if (value === '') {
                                // Remove empty values
                                delete updated[key];
                              } else {
                                updated[key] = info.type === 'number' ? Number(value) : value;
                              }
                              return updated;
                            });
                          }}
                        />
                      </div>
                    ))}
                    
                    <Button
                      onClick={() => {
                        // Check if all required fields are filled
                        const missingRequired = Object.entries(message.missingInfo)
                          .filter(([_, info]: [string, any]) => info.required)
                          .some(([key, _]) => {
                            const value = formAnswers[key];
                            return !value || (typeof value === 'string' && value.trim() === '');
                          });
                        
                        if (missingRequired) {
                          alert('Please fill in all required fields (marked with "Required" badge)');
                          return;
                        }
                        
                        // Fill defaults for optional fields not answered
                        const finalAnswers = { ...formAnswers };
                        Object.entries(message.missingInfo).forEach(([key, info]: [string, any]) => {
                          if (!finalAnswers[key] && info.default) {
                            finalAnswers[key] = info.default;
                          }
                        });
                        
                        console.log('Submitting answers:', finalAnswers);
                        setFormAnswers(finalAnswers);
                        
                        // Re-submit with the original query and new answers
                        handleSend(message.originalQuery || '');
                      }}
                      className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Continue Planning
                    </Button>
                  </div>
                )}
                
                {message.tags && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-3 gap-2 mt-4"
                  >
                    {message.tags.map((tag, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + (i * 0.1) }}
                        whileHover={{ scale: 1.05 }}
                        className="bg-gray-50 p-2 rounded border border-gray-100 flex items-center gap-2"
                      >
                        <tag.icon className="h-4 w-4 text-blue-500" />
                        <div className="overflow-hidden">
                            <div className="text-[10px] text-gray-400 uppercase font-bold">{tag.label}</div>
                            <div className="text-xs font-bold truncate">{tag.value}</div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          ))}
          
          {isLoading && (
            <div className="w-full">
              <AgentStatusCards currentStage={currentStage} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-slate-900 border-t border-slate-700/50 p-4 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          {/* Quick Suggestions */}
          {messages.length === 1 && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex flex-wrap gap-2"
            >
              <span className="text-sm text-gray-400 mr-2">Quick suggestions:</span>
              {[
                "I want to visit Paris next month",
                "Plan a family trip to Dubai",
                "Weekend getaway to somewhere exotic"
              ].map((suggestion) => (
                <motion.button
                  key={suggestion}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setInput(suggestion);
                  }}
                  className="px-3 py-1 text-sm bg-slate-800/50 text-blue-300 rounded-full hover:bg-slate-700/50 hover:text-blue-200 transition-colors border border-slate-600/50 backdrop-blur-sm"
                >
                  {suggestion}
                </motion.button>
              ))}
            </motion.div>
          )}
          
          <div className="flex gap-2">
            <motion.input
              whileFocus={{ scale: 1.01 }}
              className="flex-1 border-2 border-slate-600/50 bg-slate-800/50 text-white placeholder-gray-400 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all backdrop-blur-sm disabled:bg-slate-800/30 disabled:text-gray-500"
              placeholder="Describe your trip... (e.g., 'Weekend trip to Paris from London, budget $2000')"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => handleSend()} 
                disabled={isLoading || !input.trim()} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-auto px-6 rounded-xl transition-all shadow-lg disabled:from-gray-600 disabled:to-gray-700"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}