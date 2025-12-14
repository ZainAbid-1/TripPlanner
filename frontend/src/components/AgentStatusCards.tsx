import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  MapPin, 
  Plane, 
  Sparkles, 
  CheckCircle2, 
  Loader2,
  Hotel,
  Calendar,
  Search,
  Globe
} from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'waiting' | 'active' | 'completed';
  icon: any;
  caption: string;
  color: string;
}

interface AgentStatusCardsProps {
  currentStage: number;
}

const AGENT_DATA: Agent[] = [
  {
    id: 'planner',
    name: 'Lead Planner',
    role: 'Understanding Your Request',
    status: 'waiting',
    icon: Brain,
    caption: 'Analyzing your travel preferences and requirements...',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'analyst',
    name: 'Destination Analyst',
    role: 'Researching Destination',
    status: 'waiting',
    icon: MapPin,
    caption: 'Discovering top attractions and local insights...',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'logistics',
    name: 'Logistics Coordinator',
    role: 'Finding Best Options',
    status: 'waiting',
    icon: Plane,
    caption: 'Searching flights and hotels with best prices...',
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'curator',
    name: 'Experience Curator',
    role: 'Crafting Your Itinerary',
    status: 'waiting',
    icon: Sparkles,
    caption: 'Creating a personalized day-by-day plan...',
    color: 'from-green-500 to-emerald-500'
  }
];

export function AgentStatusCards({ currentStage }: AgentStatusCardsProps) {
  const getAgentStatus = (index: number): 'waiting' | 'active' | 'completed' => {
    if (index < currentStage - 1) return 'completed';
    if (index === currentStage - 1) return 'active';
    return 'waiting';
  };

  const agents = AGENT_DATA.map((agent, index) => ({
    ...agent,
    status: getAgentStatus(index)
  }));

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h3 className="text-3xl font-bold gradient-text mb-2">
          AI Agents at Work
        </h3>
        <p className="text-slate-300">
          Our specialized agents are collaborating to create your perfect itinerary
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: agent.status === 'active' ? 1.02 : 1, 
                y: 0,
                transition: { delay: index * 0.1 }
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`
                card-glass relative overflow-hidden
                ${agent.status === 'active' ? 'ring-2 ring-purple-500/50 animate-glow-pulse' : ''}
                ${agent.status === 'completed' ? 'opacity-70' : ''}
              `}
            >
              {agent.status === 'active' && (
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${agent.color} opacity-10`}
                  animate={{ 
                    opacity: [0.05, 0.15, 0.05],
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}

              <div className="relative z-10">
                <div className="flex items-start gap-4">
                  <div className={`
                    relative flex items-center justify-center w-16 h-16 rounded-2xl
                    ${agent.status === 'active' ? `bg-gradient-to-br ${agent.color} shadow-lg` : 'bg-white/5'}
                    ${agent.status === 'completed' ? 'bg-gradient-to-br from-green-500 to-emerald-500' : ''}
                  `}>
                    {agent.status === 'active' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <agent.icon className="h-8 w-8 text-white" />
                      </motion.div>
                    ) : agent.status === 'completed' ? (
                      <CheckCircle2 className="h-8 w-8 text-white" />
                    ) : (
                      <agent.icon className="h-8 w-8 text-slate-500" />
                    )}

                    {agent.status === 'active' && (
                      <>
                        <motion.div
                          className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${agent.color}`}
                          animate={{ 
                            scale: [1, 1.4, 1],
                            opacity: [0.6, 0, 0.6]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            ease: "easeOut"
                          }}
                        />
                        <motion.div
                          className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${agent.color}`}
                          animate={{ 
                            scale: [1, 1.6, 1],
                            opacity: [0.4, 0, 0.4]
                          }}
                          transition={{ 
                            duration: 2.5, 
                            repeat: Infinity,
                            ease: "easeOut",
                            delay: 0.3
                          }}
                        />
                      </>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-white truncate text-lg">
                        {agent.name}
                      </h4>
                      {agent.status === 'active' && (
                        <Loader2 className="h-5 w-5 text-purple-400 animate-spin flex-shrink-0" />
                      )}
                      {agent.status === 'completed' && (
                        <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-400 font-semibold mb-3 uppercase tracking-wider">
                      {agent.role}
                    </p>
                    
                    <p className={`
                      text-sm transition-colors duration-300
                      ${agent.status === 'active' ? 'text-slate-200 font-medium' : 'text-slate-400'}
                    `}>
                      {agent.status === 'completed' ? '✨ Complete!' : agent.caption}
                    </p>

                    {agent.status === 'active' && (
                      <motion.div 
                        className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className={`h-full bg-gradient-to-r ${agent.color} rounded-full`}
                          animate={{ 
                            x: ['-100%', '100%']
                          }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          style={{ width: '50%' }}
                        />
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {currentStage === 5 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mt-8"
        >
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-2xl shadow-green-500/30">
            <CheckCircle2 className="h-6 w-6" />
            <span className="font-bold text-lg">Your Itinerary is Ready! 🎉</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
