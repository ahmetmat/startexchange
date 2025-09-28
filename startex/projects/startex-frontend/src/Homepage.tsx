import React, { useEffect, useState } from 'react';
import { Github, Twitter, Globe, Rocket, Trophy, BarChart3, Users, Coins, Shield, Zap, CheckCircle, Star, TrendingUp, Compass, Wallet, LogOut } from 'lucide-react';
import { useWallet } from './hooks/useAlgorand';
import StartupLaunchForm from './components/StartupLaunchForm';
import { addLaunchedStartup, loadLaunchedStartups, type LaunchedStartupRecord } from './lib/startupStorage';

type ExperienceTab = 'discover' | 'launch' | 'invest';

const Homepage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeExperienceTab, setActiveExperienceTab] = useState<ExperienceTab>('discover');
  const [walletError, setWalletError] = useState<string | null>(null);
  const [launchedStartups, setLaunchedStartups] = useState<LaunchedStartupRecord[]>([]);

  const { isConnected, isConnecting, address, connect, disconnect } = useWallet();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setLaunchedStartups(loadLaunchedStartups());
  }, []);

  const handleWalletConnect = async () => {
    try {
      setWalletError(null);
      if (isConnected) {
        await disconnect();
      } else {
        await connect('pera');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setWalletError(error instanceof Error ? error.message : 'Wallet connection failed. Please try again.');
    }
  };

  const handleLaunchComplete = (record: LaunchedStartupRecord) => {
    const updated = addLaunchedStartup(record);
    setLaunchedStartups(updated);
    setActiveExperienceTab('discover');
  };

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  const experienceTabs: { id: ExperienceTab; title: string; description: string; icon: React.ReactNode }[] = [
    {
      id: 'discover',
      title: 'Discover Startups',
      description: 'Track trending founders, on-chain traction, and real-time GitHub momentum.',
      icon: <Compass className="w-5 h-5" />,
    },
    {
      id: 'launch',
      title: 'Launch Your Startup Token',
      description: 'Walk through a guided workflow to register your startup and configure its ASA.',
      icon: <Rocket className="w-5 h-5" />,
    },
    {
      id: 'invest',
      title: 'Invest & Support',
      description: 'Build a diversified portfolio of vetted startups with automated due diligence.',
      icon: <Coins className="w-5 h-5" />,
    },
  ];

  const stats = [
    { number: '150+', label: 'Active Startups' },
    { number: '$2.5M', label: 'Total Funded' },
    { number: '25', label: 'Live Competitions' },
    { number: '10K+', label: 'Community Members' }
  ];

  const features = [
    {
      icon: <Coins className="w-8 h-8" />,
      title: 'ASA Tokenization',
      description: 'Convert your startup into tradeable Algorand Standard Assets with just a few clicks.',
      benefits: ['One-click ASA creation', 'Smart contract automation', 'Low fees & instant finality', 'Full ecosystem compatibility']
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: 'Competition Platform',
      description: 'Compete with other startups in community-driven competitions with real prize pools.',
      benefits: ['Monthly competitions', 'Real ALGO prizes', 'Fair scoring system', 'Community voting']
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Real-Time Metrics',
      description: 'Automated tracking of GitHub activity, social media growth, and platform engagement.',
      benefits: ['GitHub integration', 'Social media tracking', 'Performance analytics', 'Transparent scoring']
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Direct Investment',
      description: 'Support startups directly by purchasing their ASA tokens and track your portfolio performance.',
      benefits: ['Direct ASA purchases', 'Portfolio tracking', 'Secondary trading', 'Yield opportunities']
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Global Ecosystem',
      description: 'Access a worldwide network of startups, investors, and supporters on Algorand.',
      benefits: ['Global accessibility', 'Cross-border payments', '24/7 trading', 'Multi-language support']
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure & Fast',
      description: "Built on Algorand's Pure Proof-of-Stake with industry-leading security and speed.",
      benefits: ['4.5 second finality', 'Carbon negative', 'Military-grade security', '99.99% uptime']
    }
  ];

  const ecosystemFeatures = [
    {
      icon: <Rocket className="w-8 h-8" />,
      title: 'For Startups',
      description: 'Everything you need to tokenize, compete, and grow your startup on Algorand.',
      benefits: ['GitHub repo integration', 'Automated ASA creation', 'Competition participation', 'Community building tools', 'Token management dashboard', 'Real-time analytics']
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'For Investors',
      description: 'Discover and invest in promising startups with transparent metrics and easy trading.',
      benefits: ['Curated startup discovery', 'Direct ASA investment', 'Portfolio analytics', 'Secondary market trading', 'Community governance', 'Risk assessment tools']
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'For Community',
      description: 'Participate in governance, competitions, and help shape the future of startup funding.',
      benefits: ['Competition voting', 'Governance participation', 'Early access opportunities', 'Community rewards', 'Educational resources', 'Networking events']
    }
  ];

  const testimonials = [
    {
      quote: "StartEx revolutionized how we approach funding. The ASA tokenization was seamless, and we raised $50K in our first month through competitions.",
      author: "Alex Chen",
      company: "TechFlow AI",
      detail: "AI Development Platform • $45K Raised"
    },
    {
      quote: "As an investor, I love the transparency and real-time metrics. The portfolio tracking is fantastic, and the community is very engaged.",
      author: "Sarah Martinez",
      company: "Crypto Investor",
      detail: "Early Investor • $25K Portfolio"
    },
    {
      quote: "The Algorand integration is flawless. Fast transactions, low fees, and the environmental benefits align perfectly with our values.",
      author: "Dr. Michael Kim",
      company: "GreenChain",
      detail: "Sustainability Startup • Top 3 Ranking"
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Connect & Register',
      description: 'Connect your Algorand wallet and register your startup with GitHub integration.',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      step: 2,
      title: 'Create ASA Token',
      description: 'Automatically generate your startup\'s ASA token with customizable parameters.',
      color: 'from-amber-500 to-amber-600'
    },
    {
      step: 3,
      title: 'Join Competitions',
      description: 'Participate in monthly competitions and win ALGO prizes based on real metrics.',
      color: 'from-violet-500 to-violet-600'
    },
    {
      step: 4,
      title: 'Grow & Trade',
      description: 'Build your community, track metrics, and enable trading of your ASA tokens.',
      color: 'from-rose-500 to-rose-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg border-b border-cyan-100 shadow-lg' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-black to-cyan-400 rounded-xl flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-black">StartEx</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-black font-medium transition-colors">Features</a>
              <a href="#ecosystem" className="text-gray-600 hover:text-black font-medium transition-colors">Ecosystem</a>
              <a href="#competitions" className="text-gray-600 hover:text-black font-medium transition-colors">Competitions</a>
              <a href="#docs" className="text-gray-600 hover:text-black font-medium transition-colors">Docs</a>
            </div>

            <button
              onClick={handleWalletConnect}
              disabled={isConnecting}
              className={`px-6 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                isConnected 
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                  : 'bg-gradient-to-r from-black to-cyan-600 text-white hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {isConnected ? <LogOut className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
              {isConnecting ? 'Connecting…' : isConnected ? shortAddress ?? 'Disconnect' : 'Connect Pera Wallet'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(0,212,255,0.1),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(0,102,204,0.1),transparent_50%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 bg-cyan-50 border border-cyan-200 text-cyan-700 px-4 py-2 rounded-full text-sm font-semibold">
                <Zap className="w-4 h-4" />
                <span>Powered by Algorand & AlgoKit</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
                Tokenize Your Startup.
                <br />
                <span className="bg-gradient-to-r from-black to-cyan-600 bg-clip-text text-transparent">
                  Build Your Future.
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Revolutionary platform bridging traditional startup funding and DeFi. 
                Convert your startup into tradeable Algorand Standard Assets (ASA) and compete 
                for funding in community-driven competitions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-gradient-to-r from-black to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2">
                  <Rocket className="w-5 h-5" />
                  <span>Launch Your Startup</span>
                </button>
                <button className="border-2 border-black text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-black hover:text-white transition-all duration-300 flex items-center justify-center space-x-2">
                  <Github className="w-5 h-5" />
                  <span>Learn More</span>
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-8 pt-8">
                {stats.slice(0, 3).map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-black text-black">{stat.number}</div>
                    <div className="text-sm text-gray-600 uppercase tracking-wide">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard Mockup */}
            <div className="relative">
              <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-black to-cyan-400" />
                
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-black">TechFlow AI</h3>
                  <span className="bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full text-sm font-semibold">Verified</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-black">Token Price</h4>
                      <p className="text-sm text-gray-600">TECH ASA</p>
                    </div>
                    <div className="text-xl font-bold text-cyan-600">$0.045</div>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-black">Market Cap</h4>
                      <p className="text-sm text-gray-600">Total Supply: 1M</p>
                    </div>
                    <div className="text-xl font-bold text-cyan-600">$45K</div>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-black">GitHub Score</h4>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Star className="w-4 h-4 mr-1" /> 189 stars
                      </p>
                    </div>
                    <div className="text-xl font-bold text-cyan-600">4,850</div>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-black">Competition Rank</h4>
                      <p className="text-sm text-gray-600">January Challenge</p>
                    </div>
                    <div className="text-xl font-bold text-cyan-600">#3</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Launch Console */}
      <section id="launch" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-cyan-100 overflow-hidden">
            <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
              <div className="bg-gradient-to-br from-cyan-900 via-slate-900 to-black text-white p-8 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
                    <Zap className="w-4 h-4" />
                    <span>Launch Console</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black mb-3">Launch Your Startup Token</h2>
                    <p className="text-sm text-cyan-100 leading-relaxed">
                      Connect your Algorand wallet, share your story, and configure your ASA with a guided wizard designed for first-time founders.
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-wide text-cyan-200 mb-1">Wallet status</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">
                        {shortAddress ? shortAddress : 'Not connected'}
                      </div>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${isConnected ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-cyan-200'}`}>
                        {isConnected ? 'Connected' : 'Wallet required'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleWalletConnect}
                    disabled={isConnecting}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold transition-all ${
                      isConnected
                        ? 'bg-white text-slate-900 hover:bg-slate-100'
                        : 'bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500'
                    }`}
                  >
                    {isConnected ? <LogOut className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                    {isConnecting ? 'Connecting…' : isConnected ? 'Disconnect Wallet' : 'Connect Pera Wallet'}
                  </button>

                  {walletError && (
                    <p className="text-xs text-red-200 bg-red-900/40 border border-red-500/40 rounded-xl px-3 py-2">
                      {walletError}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-cyan-700">Choose your journey</h3>
                    <p className="text-sm text-gray-500">Switch between discovery, launch, and investor tooling.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {experienceTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveExperienceTab(tab.id)}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                          activeExperienceTab === tab.id
                            ? 'border-cyan-500 text-cyan-600 bg-cyan-50'
                            : 'border-gray-200 text-gray-500 hover:border-cyan-300 hover:text-cyan-600'
                        }`}
                      >
                        <span className="text-cyan-500">{tab.icon}</span>
                        {tab.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6">
                  {activeExperienceTab !== 'launch' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                      {experienceTabs
                        .filter((tab) => tab.id === activeExperienceTab)
                        .map((tab) => (
                          <div key={tab.id} className="space-y-3">
                            <h4 className="text-2xl font-bold text-slate-900">{tab.title}</h4>
                            <p className="text-gray-600 leading-relaxed">{tab.description}</p>
                            <ul className="grid gap-2 text-sm text-gray-500">
                              {tab.id === 'discover' && (
                                <>
                                  <li>• Filter by traction, community sentiment, and verified metrics.</li>
                                  <li>• Follow founders and receive weekly growth digests.</li>
                                  <li>• Access competition leaderboards updated in real time.</li>
                                </>
                              )}
                              {tab.id === 'invest' && (
                                <>
                                  <li>• Allocate capital with transparent vesting and unlock schedules.</li>
                                  <li>• Review performance dashboards before committing funds.</li>
                                  <li>• Automate rebalancing with on-chain liquidity analytics.</li>
                                </>
                              )}
                            </ul>
                            {tab.id === 'discover' && (
                              <div className="mt-6 space-y-4">
                                {launchedStartups.length > 0 ? (
                                  launchedStartups.map((startup) => (
                                    <div key={startup.startupId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <h5 className="text-xl font-semibold text-slate-900">{startup.name}</h5>
                                            <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-700">
                                              {startup.tokenSymbol}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-600">{startup.description}</p>
                                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                            {startup.category && <span className="rounded-full bg-slate-100 px-2 py-0.5">{startup.category}</span>}
                                            <span>Asset #{startup.assetId}</span>
                                            <span>Launched {new Date(startup.createdAt).toLocaleDateString()}</span>
                                          </div>
                                        </div>
                                        <div className="flex flex-col items-start gap-3 md:items-end">
                                          <div className="text-right">
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Launch price</p>
                                            <p className="text-lg font-semibold text-slate-900">{startup.launchPrice.toFixed(2)} ALGO</p>
                                          </div>
                                          <div className="flex gap-2">
                                            <a
                                              className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-cyan-300 hover:text-cyan-600"
                                              href={`/trading?assetId=${startup.assetId}`}
                                            >
                                              Trade token
                                            </a>
                                            <a
                                              className="inline-flex items-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-blue-400"
                                              href={`/dashboard?startupId=${startup.startupId}`}
                                            >
                                              View dashboard
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-gray-500">
                                    Launch your first startup token to see it spotlighted here instantly.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}

                  {activeExperienceTab === 'launch' && (
                    <div className="rounded-3xl border border-cyan-200 bg-white/90 p-6 shadow-sm">
                      <StartupLaunchForm
                        isConnected={isConnected}
                        isConnecting={isConnecting}
                        address={address}
                        onConnect={handleWalletConnect}
                        onLaunchComplete={handleLaunchComplete}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-cyan-50 border border-cyan-200 text-cyan-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Trophy className="w-4 h-4" />
              <span>Key Features</span>
            </div>
            <h2 className="text-4xl font-black text-black mb-4">Why Choose StartEx?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to tokenize, compete, and grow your startup on Algorand
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-r from-black to-cyan-600 rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-black mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="py-20 bg-gradient-to-r from-black to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-4xl lg:text-5xl font-black text-cyan-300">{stat.number}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section id="ecosystem" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-cyan-50 border border-cyan-200 text-cyan-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Users className="w-4 h-4" />
              <span>For Everyone</span>
            </div>
            <h2 className="text-4xl font-black text-black mb-4">Built for the Entire Ecosystem</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're a startup founder, investor, or community member, StartEx has something for you
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {ecosystemFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-black to-cyan-600 rounded-xl flex items-center justify-center text-white mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-black mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white border border-cyan-200 text-cyan-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Zap className="w-4 h-4" />
              <span>Simple Process</span>
            </div>
            <h2 className="text-4xl font-black text-black mb-4">How StartEx Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in just a few steps and join the revolution in startup funding
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300">
                <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center text-white text-2xl font-black mb-6 mx-auto`}>
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-black mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-cyan-50 border border-cyan-200 text-cyan-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Star className="w-4 h-4" />
              <span>Success Stories</span>
            </div>
            <h2 className="text-4xl font-black text-black mb-4">What Our Community Says</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real feedback from startups and investors using StartEx
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-6">
                  "
                </div>
                <p className="text-gray-700 italic mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div>
                  <h4 className="font-bold text-black">{testimonial.author}</h4>
                  <p className="text-gray-600 text-sm">{testimonial.company}</p>
                  <p className="text-cyan-600 text-sm font-medium">{testimonial.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-cyan-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black text-black mb-6">Ready to Launch Your Startup?</h2>
          <p className="text-xl text-gray-600 mb-10">
            Join over 150 startups already using StartEx to tokenize, compete, and grow on Algorand
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-black to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2">
              <Rocket className="w-5 h-5" />
              <span>Get Started Now</span>
            </button>
            <button className="border-2 border-black text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-black hover:text-white transition-all duration-300 flex items-center justify-center space-x-2">
              <Github className="w-5 h-5" />
              <span>View Documentation</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black">StartEx</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Revolutionary platform bridging traditional startup funding and DeFi on Algorand.
              </p>
              <div className="flex space-x-4">
                <Twitter className="w-6 h-6 text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors" />
                <Github className="w-6 h-6 text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors" />
                <Globe className="w-6 h-6 text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-cyan-400 mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Competitions</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Leaderboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Trading</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-cyan-400 mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutorials</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-cyan-400 mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press Kit</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 StartEx. Built with ❤️ on Algorand. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
