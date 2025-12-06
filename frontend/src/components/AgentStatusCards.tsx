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
    <div className="w-full max-w-4xl mx-auto space-y-4 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          🤖 AI Agents Working on Your Trip
        </h3>
        <p className="text-gray-600">
          Our specialized agents are collaborating to create your perfect itinerary
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                transition: { delay: index * 0.1 }
              }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card 
                className={`
                  relative overflow-hidden transition-all duration-300
                  ${agent.status === 'active' ? 'ring-2 ring-blue-500 shadow-lg scale-105' : ''}
                  ${agent.status === 'completed' ? 'opacity-75' : ''}
                `}
              >
                {agent.status === 'active' && (
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${agent.color} opacity-10`}
                    animate={{ 
                      opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}

                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`
                      relative flex items-center justify-center w-12 h-12 rounded-full
                      ${agent.status === 'active' ? `bg-gradient-to-r ${agent.color}` : 'bg-gray-200'}
                      ${agent.status === 'completed' ? 'bg-green-500' : ''}
                    `}>
                      {agent.status === 'active' ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <agent.icon className="h-6 w-6 text-white" />
                        </motion.div>
                      ) : agent.status === 'completed' ? (
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      ) : (
                        <agent.icon className="h-6 w-6 text-gray-500" />
                      )}

                      {agent.status === 'active' && (
                        <>
                          <motion.div
                            className={`absolute inset-0 rounded-full bg-gradient-to-r ${agent.color}`}
                            animate={{ 
                              scale: [1, 1.3, 1],
                              opacity: [0.5, 0, 0.5]
                            }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity,
                              ease: "easeOut"
                            }}
                          />
                        </>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800 truncate">
                          {agent.name}
                        </h4>
                        {agent.status === 'active' && (
                          <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
                        )}
                        {agent.status === 'completed' && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 font-medium mb-2">
                        {agent.role}
                      </p>
                      
                      <p className={`
                        text-sm transition-colors duration-300
                        ${agent.status === 'active' ? 'text-gray-700 font-medium' : 'text-gray-500'}
                      `}>
                        {agent.status === 'completed' ? '✅ Complete!' : agent.caption}
                      </p>

                      {agent.status === 'active' && (
                        <motion.div 
                          className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            className={`h-full bg-gradient-to-r ${agent.color}`}
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
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {currentStage === 5 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mt-6"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Your Itinerary is Ready! 🎉</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
