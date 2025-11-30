import { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Share2, Copy, Check, UserPlus, MessageSquare, Eye, Edit3 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';

const collaborators = [
  { id: 1, name: 'Sarah Johnson', initials: 'SJ', color: 'from-pink-500 to-rose-500', status: 'editing' },
  { id: 2, name: 'Mike Chen', initials: 'MC', color: 'from-blue-500 to-cyan-500', status: 'viewing' },
  { id: 3, name: 'Emma Rodriguez', initials: 'ER', color: 'from-purple-500 to-indigo-500', status: 'viewing' },
];

const activities = [
  { user: 'Sarah Johnson', action: 'added a restaurant to Day 2', time: '2 min ago', color: 'from-pink-500 to-rose-500' },
  { user: 'Mike Chen', action: 'commented on the hotel selection', time: '5 min ago', color: 'from-blue-500 to-cyan-500' },
  { user: 'Emma Rodriguez', action: 'suggested a budget alternative', time: '12 min ago', color: 'from-purple-500 to-indigo-500' },
  { user: 'You', action: 'created this itinerary', time: '1 hour ago', color: 'from-green-500 to-emerald-500' },
];

export function CollaborativeMode() {
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const shareLink = 'https://travelagent.ai/shared/abc123';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900 mb-2">Collaborative Planning</h1>
              <p className="text-gray-600">Work together on your perfect trip</p>
            </div>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
              onClick={() => setShowInvite(!showInvite)}
            >
              <UserPlus className="h-4 w-4" />
              Invite People
            </Button>
          </div>
        </div>

        {/* Invite Panel */}
        {showInvite && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="text-gray-900 mb-4">Share this itinerary</h3>
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 bg-white"
                  />
                  <Button onClick={handleCopy} variant="outline" className="gap-2">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email addresses..."
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 bg-white"
                  />
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Send Invite
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Collaborators */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Active Collaborators ({collaborators.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback className={`bg-gradient-to-br ${collaborator.color} text-white`}>
                              {collaborator.initials}
                            </AvatarFallback>
                          </Avatar>
                          {collaborator.status === 'editing' && (
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <p className="text-gray-900">{collaborator.name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {collaborator.status === 'editing' ? (
                              <>
                                <Edit3 className="h-3 w-3 text-green-600" />
                                <span className="text-green-600">Editing</span>
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3" />
                                <span>Viewing</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Chat
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Collaborative Itinerary Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Live Editing View</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Day 1 with collaborative cursors simulation */}
                  <div className="border-2 border-dashed border-pink-300 rounded-lg p-4 bg-pink-50/30 relative">
                    <div className="absolute -top-3 left-4 flex items-center gap-2 bg-pink-500 text-white px-3 py-1 rounded-full text-xs">
                      <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                      Sarah is editing
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-600 text-white">Day 1</Badge>
                      <h4 className="text-gray-900">Arrival in Paris</h4>
                    </div>
                    <p className="text-sm text-gray-600">Click to view collaborative changes...</p>
                  </div>

                  {/* Day 2 */}
                  <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-600 text-white">Day 2</Badge>
                      <h4 className="text-gray-900">Iconic Landmarks</h4>
                    </div>
                    <p className="text-sm text-gray-600">Eiffel Tower, Seine River Cruise, Arc de Triomphe</p>
                  </div>

                  {/* Day 3 */}
                  <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-600 text-white">Day 3</Badge>
                      <h4 className="text-gray-900">Art & Culture</h4>
                    </div>
                    <p className="text-sm text-gray-600">Louvre Museum, Musée d'Orsay</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 mb-2">
                        <strong>Mike Chen:</strong> Should we add a dinner cruise on Day 2?
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Reply</Button>
                        <Button size="sm" variant="outline">Add to Plan</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-6">
                <h3 className="text-gray-900 mb-4">Collaboration Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-gray-900 text-sm">Real-time Editing</p>
                      <p className="text-xs text-gray-600">See changes as they happen</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-gray-900 text-sm">Inline Comments</p>
                      <p className="text-xs text-gray-600">Discuss specific items</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Share2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-gray-900 text-sm">Easy Sharing</p>
                      <p className="text-xs text-gray-600">Share via link or email</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Eye className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-gray-900 text-sm">View Only Mode</p>
                      <p className="text-xs text-gray-600">Control permissions</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex gap-3">
                          <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${activity.color} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              <strong>{activity.user}</strong> {activity.action}
                            </p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                        {index < activities.length - 1 && <Separator className="mt-4" />}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
                <CardContent className="p-4">
                  <h4 className="text-gray-900 mb-2">Pro Tip</h4>
                  <p className="text-sm text-gray-700">
                    Assign tasks to collaborators and track who's responsible for booking each item!
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
