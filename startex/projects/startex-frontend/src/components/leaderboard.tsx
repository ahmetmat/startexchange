import React, { useState } from 'react';
import { 
  Trophy, Medal, Crown, TrendingUp, TrendingDown, Users, Github, Twitter, Globe, 
  Rocket, Award, Star, Filter, Search, Target, ChevronUp, ChevronDown, 
  ExternalLink, Coins, Eye, Calendar, Zap, CheckCircle
} from 'lucide-react';

interface StartupEntry {
  id: string;
  rank: number;
  previousRank?: number;
  name: string;
  description: string;
  founder: string;
  category: string;
  score: number;
  change: string;
  tokenSymbol: string;
  tokenPrice: number;
  priceChange: string;
  marketCap: number;
  holders: number;
  verified: boolean;
  githubStats: {
    commits: number;
    stars: number;
    forks: number;
  };
  socialStats: {
    twitterFollowers: number;
    linkedinFollowers?: number;
  };
  platformStats: {
    posts: number;
    views: number;
  };
  competitionsWon: number;
  website?: string;
  github?: string;
  twitter?: string;
  createdAt: string;
}

type LeaderboardPeriod = 'overall' | 'monthly' | 'weekly';

const Leaderboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('overall');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'holders' | 'marketCap'>('score');

  const leaderboardData: StartupEntry[] = [
    {
      id: 'techflow-ai',
      rank: 1,
      previousRank: 2,
      name: 'TechFlow AI',
      description: 'Next-generation AI development platform',
      founder: 'Alex Chen',
      category: 'AI/ML',
      score: 4850,
      change: '+125',
      tokenSymbol: 'TECH',
      tokenPrice: 0.045,
      priceChange: '+15.2%',
      marketCap: 45000,
      holders: 234,
      verified: true,
      githubStats: { commits: 445, stars: 189, forks: 67 },
      socialStats: { twitterFollowers: 2400, linkedinFollowers: 1200 },
      platformStats: { posts: 25, views: 8900 },
      competitionsWon: 3,
      website: 'https://techflow.ai',
      github: 'https://github.com/techflow/ai',
      twitter: '@techflowai',
      createdAt: '2024-01-15'
    },
    {
      id: 'greenchain-solutions',
      rank: 2,
      previousRank: 1,
      name: 'GreenChain Solutions',
      description: 'Sustainable blockchain solutions for environmental impact',
      founder: 'Sarah Martinez',
      category: 'Sustainability',
      score: 4720,
      change: '-45',
      tokenSymbol: 'GREEN',
      tokenPrice: 0.032,
      priceChange: '+8.7%',
      marketCap: 32000,
      holders: 198,
      verified: true,
      githubStats: { commits: 378, stars: 156, forks: 43 },
      socialStats: { twitterFollowers: 1980, linkedinFollowers: 950 },
      platformStats: { posts: 18, views: 6700 },
      competitionsWon: 2,
      website: 'https://greenchain.eco',
      github: 'https://github.com/greenchain/solutions',
      twitter: '@greenchainsol',
      createdAt: '2024-02-01'
    },
    {
      id: 'healthsync-pro',
      rank: 3,
      previousRank: 4,
      name: 'HealthSync Pro',
      description: 'Digital health management and telemedicine platform',
      founder: 'Dr. Michael Kim',
      category: 'HealthTech',
      score: 4590,
      change: '+89',
      tokenSymbol: 'HEALTH',
      tokenPrice: 0.028,
      priceChange: '+12.4%',
      marketCap: 28000,
      holders: 167,
      verified: true,
      githubStats: { commits: 321, stars: 134, forks: 38 },
      socialStats: { twitterFollowers: 1650, linkedinFollowers: 820 },
      platformStats: { posts: 22, views: 5400 },
      competitionsWon: 1,
      website: 'https://healthsync.pro',
      github: 'https://github.com/healthsync/pro',
      twitter: '@healthsyncpro',
      createdAt: '2024-01-22'
    },
    {
      id: 'crypto-learn',
      rank: 4,
      previousRank: 3,
      name: 'CryptoLearn',
      description: 'Educational platform for blockchain and cryptocurrency',
      founder: 'Emma Thompson',
      category: 'Education',
      score: 4420,
      change: '-67',
      tokenSymbol: 'LEARN',
      tokenPrice: 0.019,
      priceChange: '+3.1%',
      marketCap: 19000,
      holders: 145,
      verified: false,
      githubStats: { commits: 289, stars: 112, forks: 29 },
      socialStats: { twitterFollowers: 1420, linkedinFollowers: 670 },
      platformStats: { posts: 31, views: 7200 },
      competitionsWon: 1,
      website: 'https://cryptolearn.io',
      github: 'https://github.com/cryptolearn/platform',
      twitter: '@cryptolearnio',
      createdAt: '2024-02-10'
    },
    {
      id: 'devtools-studio',
      rank: 5,
      previousRank: 6,
      name: 'DevTools Studio',
      description: 'Advanced development tools and IDE solutions',
      founder: 'James Wilson',
      category: 'Developer Tools',
      score: 4280,
      change: '+78',
      tokenSymbol: 'DEV',
      tokenPrice: 0.015,
      priceChange: '+6.8%',
      marketCap: 15000,
      holders: 123,
      verified: false,
      githubStats: { commits: 567, stars: 203, forks: 84 },
      socialStats: { twitterFollowers: 1150, linkedinFollowers: 580 },
      platformStats: { posts: 19, views: 4800 },
      competitionsWon: 0,
      website: 'https://devtools.studio',
      github: 'https://github.com/devtools/studio',
      twitter: '@devtoolsstudio',
      createdAt: '2024-01-30'
    },
    {
      id: 'foodchain-tracker',
      rank: 6,
      previousRank: 5,
      name: 'FoodChain Tracker',
      description: 'Supply chain transparency for food industry',
      founder: 'Maria Rodriguez',
      category: 'Supply Chain',
      score: 4150,
      change: '-45',
      tokenSymbol: 'FOOD',
      tokenPrice: 0.022,
      priceChange: '-2.1%',
      marketCap: 22000,
      holders: 98,
      verified: true,
      githubStats: { commits: 198, stars: 89, forks: 23 },
      socialStats: { twitterFollowers: 890, linkedinFollowers: 450 },
      platformStats: { posts: 14, views: 3200 },
      competitionsWon: 1,
      website: 'https://foodchain.track',
      github: 'https://github.com/foodchain/tracker',
      twitter: '@foodchaintrack',
      createdAt: '2024-02-05'
    }
  ];

  const categories = Array.from(new Set(leaderboardData.map(entry => entry.category)));

  const filteredData = leaderboardData
    .filter(entry => {
      const matchesSearch = entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           entry.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           entry.founder.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'holders') return b.holders - a.holders;
      if (sortBy === 'marketCap') return b.marketCap - a.marketCap;
      return 0;
    });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-500" />;
    return <span className="text-2xl font-bold text-gray-900">#{rank}</span>;
  };

  const getTrendIcon = (current: number, previous?: number) => {
    if (typeof previous !== 'number') return <div className="w-4 h-4" />;
    if (current < previous) return <ChevronUp className="w-4 h-4 text-green-500" />;
    if (current > previous) return <ChevronDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4" />;
  };

  const isNewEntry = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7; // New if created within last 7 days
  };

  const TopThreeCard: React.FC<{ entry: StartupEntry; position: number }> = ({ entry, position }) => {
    const isFirst = position === 1;
    const isSecond = position === 2;
    const isThird = position === 3;

    return (
      <div className={`relative ${isFirst ? 'md:order-2 transform md:scale-110' : isSecond ? 'md:order-1' : 'md:order-3'}`}>
        <div className={`bg-white/90 backdrop-blur-sm border-2 rounded-3xl p-8 text-center transition-all hover:shadow-2xl ${
          isFirst ? 'border-yellow-300 bg-gradient-to-b from-yellow-50 to-orange-50' :
          isSecond ? 'border-gray-300 bg-gradient-to-b from-gray-50 to-slate-50' :
          'border-orange-300 bg-gradient-to-b from-orange-50 to-red-50'
        }`}>
          <div className="space-y-4">
            <div className="flex justify-center">{getRankIcon(entry.rank)}</div>
            <div className="w-20 h-20 bg-gradient-to-r from-black to-cyan-600 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-2xl">{entry.tokenSymbol.slice(0, 2)}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <h3 className="text-xl font-bold text-gray-900">{entry.name}</h3>
                {entry.verified && <CheckCircle className="w-5 h-5 text-blue-500" />}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{entry.description}</p>
              <div className="text-xs text-gray-500">{entry.category}</div>
            </div>

            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">{entry.score.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Total Score</div>
              <div className={`text-sm font-medium ${
                entry.change.startsWith('+') ? 'text-green-600' : 
                entry.change.startsWith('-') ? 'text-red-600' : 'text-gray-500'
              }`}>
                {entry.change} this week
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-bold text-blue-600">${entry.tokenPrice.toFixed(3)}</div>
                <div className="text-gray-500">Price</div>
              </div>
              <div>
                <div className="font-bold text-purple-600">{entry.holders}</div>
                <div className="text-gray-500">Holders</div>
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              {entry.website && (
                <a href={entry.website} className="w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors">
                  <Globe className="w-4 h-4 text-blue-600" />
                </a>
              )}
              {entry.github && (
                <a href={entry.github} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors">
                  <Github className="w-4 h-4 text-gray-600" />
                </a>
              )}
              {entry.twitter && (
                <a href={`https://twitter.com/${entry.twitter.replace('@', '')}`} className="w-8 h-8 bg-sky-100 hover:bg-sky-200 rounded-lg flex items-center justify-center transition-colors">
                  <Twitter className="w-4 h-4 text-sky-600" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StartupRow: React.FC<{ entry: StartupEntry }> = ({ entry }) => {
    return (
      <div className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              {getRankIcon(entry.rank)}
              {getTrendIcon(entry.rank, entry.previousRank)}
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-black to-cyan-600 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">{entry.tokenSymbol.slice(0, 2)}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center flex-wrap gap-2">
                  <h3 className="text-xl font-bold text-gray-900">{entry.name}</h3>
                  {entry.verified && <CheckCircle className="w-5 h-5 text-blue-500" />}
                  {isNewEntry(entry.createdAt) && (
                    <span className="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">
                      New
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm max-w-md line-clamp-2">{entry.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>by {entry.founder}</span>
                  <span className="px-2 py-1 bg-gray-100 rounded-full">{entry.category}</span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Joined {new Date(entry.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-900">{entry.score.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Score</div>
              <div className={`text-xs font-medium ${
                entry.change.startsWith('+') ? 'text-green-600' : 
                entry.change.startsWith('-') ? 'text-red-600' : 'text-gray-500'
              }`}>{entry.change}</div>
            </div>

            <div className="space-y-1">
              <div className="text-lg font-bold text-blue-600">${entry.tokenPrice.toFixed(3)}</div>
              <div className="text-xs text-gray-500">Token Price</div>
              <div className={`text-xs font-medium ${
                entry.priceChange.startsWith('+') ? 'text-green-600' : 
                entry.priceChange.startsWith('-') ? 'text-red-600' : 'text-gray-500'
              }`}>{entry.priceChange}</div>
            </div>

            <div className="space-y-1">
              <div className="text-lg font-bold text-purple-600">{entry.holders}</div>
              <div className="text-xs text-gray-500">Holders</div>
              <div className="text-xs text-gray-500">${(entry.marketCap / 1000).toFixed(0)}K cap</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-bold text-gray-900">{entry.githubStats.stars}</span>
              </div>
              <div className="text-xs text-gray-500">GitHub Stars</div>
              <div className="text-xs text-gray-500">{entry.githubStats.commits} commits</div>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <div className="flex space-x-2">
              {entry.website && (
                <a href={entry.website} className="w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors">
                  <Globe className="w-4 h-4 text-blue-600" />
                </a>
              )}
              {entry.github && (
                <a href={entry.github} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors">
                  <Github className="w-4 h-4 text-gray-600" />
                </a>
              )}
              {entry.twitter && (
                <a href={`https://twitter.com/${entry.twitter.replace('@', '')}`} className="w-8 h-8 bg-sky-100 hover:bg-sky-200 rounded-lg flex items-center justify-center transition-colors">
                  <Twitter className="w-4 h-4 text-sky-600" />
                </a>
              )}
            </div>

            <div className="flex space-x-2">
              <button className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-all">
                View Details
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-black to-cyan-600 hover:shadow-lg text-white rounded-lg text-sm font-medium transition-all">
                Invest
              </button>
            </div>

            {entry.competitionsWon > 0 && (
              <div className="flex items-center space-x-1 text-xs text-orange-600">
                <Trophy className="w-3 h-3" />
                <span>{entry.competitionsWon} wins</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-6 py-3 rounded-full border border-orange-200">
              <Trophy className="w-5 h-5 text-orange-500 animate-pulse" />
              <span className="text-orange-700 font-semibold">Top Performers</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-gray-900">
              Startup
              <span className="block bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent">
                Leaderboard
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the fastest-growing startups on Algorand. Track performance, 
              compare metrics, and find your next investment opportunity.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search startups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500 transition-all"
            />
          </div>

          <div className="flex space-x-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as LeaderboardPeriod)}
              className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500"
            >
              <option value="overall">Overall</option>
              <option value="monthly">This Month</option>
              <option value="weekly">This Week</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500"
            >
              <option value="score">By Score</option>
              <option value="holders">By Holders</option>
              <option value="marketCap">By Market Cap</option>
            </select>
          </div>
        </div>

        {/* Top 3 Showcase */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Top 3 Performers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredData.slice(0, 3).map((entry, index) => (
              <TopThreeCard key={entry.id} entry={entry} position={index + 1} />
            ))}
          </div>
        </div>

        {/* Full Rankings */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900">Full Rankings</h2>
            <div className="text-sm text-gray-500">
              {filteredData.length} startups • Updated live
            </div>
          </div>

          {filteredData.slice(3).map((entry) => (
            <StartupRow key={entry.id} entry={entry} />
          ))}

          {filteredData.length === 0 && (
            <div className="bg-white/70 border border-dashed border-orange-300 rounded-2xl p-12 text-center text-gray-500">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-2xl font-bold text-gray-400 mb-2">No startups found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Startups', value: '150+', icon: Rocket },
            { label: 'Total Score Points', value: '2.5M+', icon: Trophy },
            { label: 'Active Competitions', value: '25', icon: Target },
            { label: 'Community Members', value: '10K+', icon: Users }
          ].map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 text-center">
                <IconComponent className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Methodology Section */}
        <div className="mt-16 bg-white rounded-3xl p-12 border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How We Calculate Rankings</h2>
            <p className="text-xl text-gray-600">Our transparent scoring system evaluates multiple factors</p>
          </div>
          
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Github className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Development Activity</h3>
              <p className="text-gray-600 text-sm">GitHub commits, stars, forks, and contributor activity</p>
              <div className="text-orange-600 font-semibold mt-2">40% Weight</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Community Growth</h3>
              <p className="text-gray-600 text-sm">Social media followers, engagement, and community size</p>
              <div className="text-orange-600 font-semibold mt-2">25% Weight</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Token Performance</h3>
              <p className="text-gray-600 text-sm">Price appreciation, holder growth, and trading volume</p>
              <div className="text-orange-600 font-semibold mt-2">20% Weight</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Competition Success</h3>
              <p className="text-gray-600 text-sm">Competition wins, rankings, and peer recognition</p>
              <div className="text-orange-600 font-semibold mt-2">15% Weight</div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              Rankings are updated in real-time based on blockchain data and platform activity. 
              All metrics are verified and transparent.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-orange-100 via-red-50 to-pink-100 p-12 text-center">
          <div className="space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900">Want to Join the Rankings?</h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              Register your startup, tokenize on Algorand, and compete with the best
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                Register Your Startup
              </button>
              <button className="border-2 border-orange-500 text-orange-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-500 hover:text-white transition-all duration-300">
                Learn How Rankings Work
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;