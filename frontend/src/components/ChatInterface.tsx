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
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="max-w-5xl mx-auto space-y-6">
          {showQuickForm && messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="glass-strong rounded-3xl p-8 md:p-10 shadow-2xl border border-white/20 overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/10 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold gradient-text flex items-center gap-3">
                    <Sparkles className="h-7 w-7 text-purple-400" />
                    Quick Trip Planner
                  </h2>
                  <button 
                    onClick={() => setShowQuickForm(false)}
                    className="text-slate-300 hover:text-white transition-colors text-sm font-medium hover:underline"
                  >
                    Skip & Chat Instead →
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-purple-400" /> Destination
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Paris, Dubai, Tokyo"
                      value={quickFormData.destination}
                      onChange={(e) => setQuickFormData({...quickFormData, destination: e.target.value})}
                      className="input-glass w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-pink-400" /> From (Origin)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., New York, London"
                      value={quickFormData.origin}
                      onChange={(e) => setQuickFormData({...quickFormData, origin: e.target.value})}
                      className="input-glass w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-cyan-400" /> Start Date
                    </label>
                    <input
                      type="date"
                      value={quickFormData.start_date}
                      onChange={(e) => setQuickFormData({...quickFormData, start_date: e.target.value})}
                      className="input-glass w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-400" /> Duration (days)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 3, 5, 7"
                      value={quickFormData.duration}
                      onChange={(e) => setQuickFormData({...quickFormData, duration: e.target.value})}
                      className="input-glass w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-400" /> Number of Travelers
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 1, 2, 4"
                      value={quickFormData.travelers}
                      onChange={(e) => setQuickFormData({...quickFormData, travelers: e.target.value})}
                      className="input-glass w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-400" /> Budget (USD)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 1000, 2500"
                      value={quickFormData.budget_usd}
                      onChange={(e) => setQuickFormData({...quickFormData, budget_usd: e.target.value})}
                      className="input-glass w-full"
                    />
                  </div>
                </div>
                
                <Button
                  onClick={handleQuickFormSubmit}
                  disabled={!quickFormData.destination}
                  className="btn-primary w-full py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <Sparkles className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Generate My Itinerary
                </Button>
              </div>
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
                whileHover={{ scale: message.type === 'form' ? 1 : 1.02 }}
                className={`
                  max-w-[85%] rounded-2xl px-6 py-4 shadow-xl
                  ${message.type === 'user' 
                    ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white rounded-tr-md shadow-purple-500/30' 
                    : message.type === 'system' 
                      ? 'glass border-orange-400/30 text-orange-100' 
                      : message.type === 'error' 
                        ? 'glass border-red-400/30 text-red-100' 
                        : message.type === 'form' 
                          ? 'glass-strong border-purple-400/40 text-white max-w-full' 
                          : 'glass text-slate-100 rounded-tl-md'}
                `}
              >
                <p className="whitespace-pre-wrap leading-relaxed flex items-center gap-2">
                  {message.type === 'form' && <Info className="h-5 w-5 text-purple-400" />}
                  {message.content}
                </p>
                
                {message.type === 'form' && message.missingInfo && (
                  <div className="mt-6 space-y-4 glass-subtle p-6 rounded-2xl border border-white/10">
                    {Object.entries(message.missingInfo)
                      .sort(([, a]: [string, any], [, b]: [string, any]) => (a.priority || 999) - (b.priority || 999))
                      .map(([key, info]: [string, any]) => (
                      <div key={key} className="space-y-2">
                        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                          {info.question}
                          {info.required ? (
                            <Badge className="text-xs bg-pink-500/80 text-white border-pink-400/50">Required</Badge>
                          ) : (
                            <Badge className="text-xs bg-white/10 text-slate-300 border-white/10">Optional</Badge>
                          )}
                        </label>
                        {info.hint && (
                          <p className="text-xs text-slate-400 -mt-1">{info.hint}</p>
                        )}
                        <input
                          type={info.type === 'number' ? 'number' : 'text'}
                          placeholder={info.hint || (info.default ? `Default: ${info.default}` : '')}
                          className="input-glass w-full"
                          onChange={(e) => {
                            const value = e.target.value.trim();
                            setFormAnswers(prev => {
                              const updated = { ...prev };
                              if (value === '') {
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
                        
                        const finalAnswers = { ...formAnswers };
                        Object.entries(message.missingInfo).forEach(([key, info]: [string, any]) => {
                          if (!finalAnswers[key] && info.default) {
                            finalAnswers[key] = info.default;
                          }
                        });
                        
                        console.log('Submitting answers:', finalAnswers);
                        setFormAnswers(finalAnswers);
                        
                        handleSend(message.originalQuery || '');
                      }}
                      className="btn-primary mt-6 w-full py-3"
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
                    className="grid grid-cols-3 gap-3 mt-6"
                  >
                    {message.tags.map((tag, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + (i * 0.1) }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="glass-subtle p-3 rounded-xl border border-white/10 flex items-center gap-2"
                      >
                        <tag.icon className="h-5 w-5 text-purple-400 flex-shrink-0" />
                        <div className="overflow-hidden">
                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{tag.label}</div>
                            <div className="text-sm font-bold text-white truncate">{tag.value}</div>
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

      <div className="p-6 backdrop-blur-xl relative">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/50 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          {messages.length === 1 && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex flex-wrap gap-2 items-center"
            >
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-slate-400 font-medium">Try:</span>
              {[
                "I want to visit Paris next month",
                "Plan a family trip to Dubai",
                "Weekend getaway somewhere exotic"
              ].map((suggestion) => (
                <motion.button
                  key={suggestion}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setInput(suggestion);
                  }}
                  className="px-4 py-1.5 text-sm glass-subtle text-slate-200 rounded-full hover:glass transition-all border border-white/10 hover:border-white/20"
                >
                  {suggestion}
                </motion.button>
              ))}
            </motion.div>
          )}
          
          <div className="glass-strong rounded-full p-2 shadow-2xl flex gap-3 border border-white/20">
            <motion.input
              whileFocus={{ scale: 1.005 }}
              className="flex-1 bg-transparent text-white placeholder-slate-400 px-6 py-3 focus:outline-none disabled:text-slate-500"
              placeholder="Describe your dream trip..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => handleSend()} 
                disabled={isLoading || !input.trim()} 
                className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-700 transition-all shadow-lg hover:shadow-purple-500/50 p-0"
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