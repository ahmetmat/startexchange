import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Trophy, Users, Coins, Github, Twitter, Globe, 
  Star, GitBranch, Eye, Calendar, Settings, Bell, Search, Filter,
  ArrowUpRight, ArrowDownRight, Plus, ExternalLink, Award, Zap,
  Activity, DollarSign, Target, CheckCircle, AlertCircle, Clock
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'competitions' | 'tokens'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Mock data for the dashboard
  const startupData = {
    name: "TechFlow AI",
    tokenSymbol: "TECH",
    description: "Next-generation AI development platform for modern applications",
    verified: true,
    founded: "2024",
    category: "AI/ML",
    website: "https://techflow.ai",
    github: "https://github.com/techflow/ai",
    twitter: "@techflowai",
    walletAddress: "ALGO123...XYZ789",
    rank: 3,
    score: 4850
  };

  const tokenMetrics = {
    price: 0.045,
    priceChange: 15.2,
    marketCap: 45000,
    volume24h: 12500,
    holders: 234,
    totalSupply: 1000000,
    circulatingSupply: 850000
  };

  const githubMetrics = {
    commits: 445,
    commitsChange: 12,
    stars: 189,
    starsChange: 25,
    forks: 67,
    forksChange: 8,
    contributors: 12,
    lastCommit: "2 hours ago"
  };

  const socialMetrics = {
    twitterFollowers: 2400,
    twitterChange: 8.5,
    linkedinFollowers: 1200,
    linkedinChange: 12.3,
    discordMembers: 850,
    discordChange: 15.7
  };

  const competitions = [
    {
      id: 1,
      name: "January Growth Challenge",
      description: "Compete for the highest growth metrics this month",
      status: "active" as const,
      endDate: "2025-01-31",
      participants: 127,
      prizePool: "15000 ALGO",
      myRank: 3,
      daysLeft: 12,
      category: "Growth",
      joined: true
    },
    {
      id: 2,
      name: "Demo Day Showcase",
      description: "Present your latest product demo to investors",
      status: "upcoming" as const,
      startDate: "2025-02-15",
      participants: 0,
      maxParticipants: 50,
      prizePool: "25000 ALGO",
      category: "Demo",
      joined: false,
      registrationEnds: "2025-02-10"
    },
    {
      id: 3,
      name: "AI Innovation Sprint",
      description: "Build innovative AI features for your startup",
      status: "ended" as const,
      endDate: "2024-12-31",
      participants: 89,
      prizePool: "10000 ALGO",
      myRank: 7,
      category: "Innovation",
      joined: true
    }
  ];

  const recentActivity = [
    {
      type: "commit",
      message: "Added new authentication system",
      time: "2 hours ago",
      impact: "+25 points"
    },
    {
      type: "social",
      message: "Gained 25 new Twitter followers",
      time: "4 hours ago",
      impact: "+12 points"
    },
    {
      type: "demo",
      message: "Demo video reached 100 views",
      time: "1 day ago",
      impact: "+8 points"
    },
    {
      type: "token",
      message: "50 new token holders joined",
      time: "2 days ago",
      impact: "+15 points"
    }
  ];

  const portfolioData = [
    { asset: "TECH", amount: 850000, value: 38250, change: 15.2 },
    { asset: "ALGO", amount: 2500, value: 2750, change: 3.1 },
    { asset: "USDC", amount: 5000, value: 5000, change: 0.0 }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'commit': return <Github className="w-5 h-5 text-green-500" />;
      case 'social': return <Twitter className="w-5 h-5 text-blue-500" />;
      case 'demo': return <Eye className="w-5 h-5 text-purple-500" />;
      case 'token': return <Coins className="w-5 h-5 text-orange-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-black to-cyan-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {startupData.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">T</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Startup Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-gradient-to-r from-black to-cyan-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-2xl font-bold">AI</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-black text-gray-900">{startupData.name}</h1>
                  {startupData.verified && (
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm font-semibold">
                    #{startupData.rank}
                  </span>
                </div>
                <p className="text-gray-600 max-w-2xl">{startupData.description}</p>
                <div className="flex items-center space-x-6 text-sm">
                  <a href={startupData.website} className="flex items-center space-x-1 text-gray-500 hover:text-cyan-600">
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                  <a href={startupData.github} className="flex items-center space-x-1 text-gray-500 hover:text-cyan-600">
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                  <a href={`https://twitter.com/${startupData.twitter.replace('@', '')}`} className="flex items-center space-x-1 text-gray-500 hover:text-cyan-600">
                    <Twitter className="w-4 h-4" />
                    <span>{startupData.twitter}</span>
                  </a>
                </div>
              </div>
            </div>
            
            <div className="mt-6 lg:mt-0 text-right">
              <div className="text-3xl font-black text-cyan-600">{startupData.score.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Total Score</div>
              <div className="text-sm text-green-600 font-medium">+125 this week</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'metrics', label: 'Metrics', icon: TrendingUp },
            { id: 'competitions', label: 'Competitions', icon: Trophy },
            { id: 'tokens', label: 'Tokens', icon: Coins }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Token Price</p>
                    <p className="text-2xl font-bold text-gray-900">${tokenMetrics.price.toFixed(3)}</p>
                    <p className="text-sm text-green-600">+{tokenMetrics.priceChange}%</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Market Cap</p>
                    <p className="text-2xl font-bold text-gray-900">${(tokenMetrics.marketCap / 1000).toFixed(1)}K</p>
                    <p className="text-sm text-gray-500">{tokenMetrics.holders} holders</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">GitHub Stars</p>
                    <p className="text-2xl font-bold text-gray-900">{githubMetrics.stars}</p>
                    <p className="text-sm text-green-600">+{githubMetrics.starsChange} this month</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Competition Rank</p>
                    <p className="text-2xl font-bold text-gray-900">#{competitions[0].myRank}</p>
                    <p className="text-sm text-orange-600">{competitions[0].name}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Activity */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                  <button className="text-cyan-600 hover:text-cyan-700 text-sm font-medium">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                      <span className="text-sm font-medium text-green-600">{activity.impact}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Portfolio Overview */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Portfolio</h3>
                  <button className="text-cyan-600 hover:text-cyan-700 text-sm font-medium">
                    Manage
                  </button>
                </div>
                <div className="space-y-4">
                  {portfolioData.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{asset.asset.slice(0, 2)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{asset.asset}</p>
                          <p className="text-sm text-gray-500">{asset.amount.toLocaleString()} tokens</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${asset.value.toLocaleString()}</p>
                        <p className={`text-sm ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset.change >= 0 ? '+' : ''}{asset.change}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Total Portfolio Value</span>
                    <span className="text-xl font-bold text-gray-900">
                      ${portfolioData.reduce((sum, asset) => sum + asset.value, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-8">
            {/* Time Range Selector */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Performance Metrics</h2>
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {[
                  { value: '7d', label: '7 Days' },
                  { value: '30d', label: '30 Days' },
                  { value: '90d', label: '90 Days' }
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value as any)}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                      timeRange === range.value
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* GitHub Metrics */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">GitHub Activity</h3>
                  <Github className="w-6 h-6 text-gray-400" />
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{githubMetrics.commits}</div>
                      <div className="text-sm text-gray-500">Total Commits</div>
                      <div className="text-sm text-green-600">+{githubMetrics.commitsChange}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{githubMetrics.stars}</div>
                      <div className="text-sm text-gray-500">Stars</div>
                      <div className="text-sm text-green-600">+{githubMetrics.starsChange}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{githubMetrics.forks}</div>
                      <div className="text-sm text-gray-500">Forks</div>
                      <div className="text-sm text-green-600">+{githubMetrics.forksChange}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{githubMetrics.contributors}</div>
                      <div className="text-sm text-gray-500">Contributors</div>
                      <div className="text-sm text-gray-500">{githubMetrics.lastCommit}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media Metrics */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Social Media</h3>
                  <Twitter className="w-6 h-6 text-gray-400" />
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Twitter Followers</span>
                      <span className="text-sm text-green-600">+{socialMetrics.twitterChange}%</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{socialMetrics.twitterFollowers.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">LinkedIn Followers</span>
                      <span className="text-sm text-green-600">+{socialMetrics.linkedinChange}%</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{socialMetrics.linkedinFollowers.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Discord Members</span>
                      <span className="text-sm text-green-600">+{socialMetrics.discordChange}%</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{socialMetrics.discordMembers.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Competitions Tab */}
        {activeTab === 'competitions' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Competitions</h2>
              <button className="bg-gradient-to-r from-black to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
                Browse All Competitions
              </button>
            </div>

            <div className="space-y-6">
              {competitions.map((competition) => (
                <div key={competition.id} className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start space-x-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-bold text-gray-900">{competition.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(competition.status)}`}>
                            {competition.status.toUpperCase()}
                          </span>
                          {competition.joined && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                              JOINED
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600">{competition.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{competition.participants} participants</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Coins className="w-4 h-4" />
                            <span>{competition.prizePool} prize pool</span>
                          </span>
                          {competition.status === 'active' && competition.daysLeft && (
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{competition.daysLeft} days left</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 lg:mt-0 text-right space-y-3">
                      {competition.myRank && (
                        <div>
                          <div className="text-2xl font-bold text-purple-600">#{competition.myRank}</div>
                          <div className="text-sm text-gray-500">Current Rank</div>
                        </div>
                      )}
                      <div className="flex space-x-3">
                        {!competition.joined && competition.status !== 'ended' && (
                          <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all">
                            Join Competition
                          </button>
                        )}
                        <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-all">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Token Management</h2>
              <button className="bg-gradient-to-r from-black to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create New Token</span>
              </button>
            </div>

            {/* Token Overview */}
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-black to-cyan-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xl font-bold">{startupData.tokenSymbol}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{startupData.tokenSymbol} Token</h3>
                      <p className="text-gray-600">Algorand Standard Asset</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Price</span>
                      <span className="font-bold text-gray-900">${tokenMetrics.price.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Market Cap</span>
                      <span className="font-bold text-gray-900">${tokenMetrics.marketCap.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Supply</span>
                      <span className="font-bold text-gray-900">{tokenMetrics.totalSupply.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Circulating Supply</span>
                      <span className="font-bold text-gray-900">{tokenMetrics.circulatingSupply.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Holders</span>
                      <span className="font-bold text-gray-900">{tokenMetrics.holders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">24h Volume</span>
                      <span className="font-bold text-gray-900">${tokenMetrics.volume24h.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Token Actions</h4>
                  <div className="space-y-4">
                    <button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
                      Transfer Tokens
                    </button>
                    <button className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                      View on AlgoExplorer
                    </button>
                    <button className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                      Update Token Info
                    </button>
                  </div>

                  <div className="mt-8">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Price Performance</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">24h Change</span>
                        <span className="text-green-600 font-semibold">+{tokenMetrics.priceChange}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">7d Change</span>
                        <span className="text-green-600 font-semibold">+24.7%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">30d Change</span>
                        <span className="text-green-600 font-semibold">+89.3%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Token Holders */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Top Token Holders</h3>
                <button className="text-cyan-600 hover:text-cyan-700 text-sm font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { address: "ALGO1234...XYZ789", amount: 150000, percentage: 17.6 },
                  { address: "ALGO5678...ABC123", amount: 125000, percentage: 14.7 },
                  { address: "ALGO9012...DEF456", amount: 100000, percentage: 11.8 },
                  { address: "ALGO3456...GHI789", amount: 85000, percentage: 10.0 },
                  { address: "ALGO7890...JKL012", amount: 75000, percentage: 8.8 }
                ].map((holder, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      <span className="font-mono text-sm text-gray-900">{holder.address}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{holder.amount.toLocaleString()} TECH</div>
                      <div className="text-sm text-gray-500">{holder.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
                <button className="text-cyan-600 hover:text-cyan-700 text-sm font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { type: "mint", amount: 50000, to: "ALGO1234...XYZ789", time: "2 hours ago", hash: "TX123...ABC" },
                  { type: "transfer", amount: 25000, to: "ALGO5678...DEF456", time: "5 hours ago", hash: "TX456...DEF" },
                  { type: "transfer", amount: 10000, to: "ALGO9012...GHI789", time: "1 day ago", hash: "TX789...GHI" },
                  { type: "mint", amount: 100000, to: "ALGO3456...JKL012", time: "2 days ago", hash: "TX012...JKL" }
                ].map((tx, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type === 'mint' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {tx.type === 'mint' ? (
                          <Plus className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 capitalize">{tx.type}</div>
                        <div className="text-sm text-gray-500">To: {tx.to}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{tx.amount.toLocaleString()} TECH</div>
                      <div className="text-sm text-gray-500">{tx.time}</div>
                    </div>
                    <button className="text-cyan-600 hover:text-cyan-700">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;