    'use client'

    import { useEffect, useMemo, useState } from 'react'
    import { AppConfig, UserSession } from '@stacks/auth'
    import type { UserData } from '@stacks/auth'
    import {
    TrendingUp,
    Wallet,
    Activity,
    Coins,
    Search,
    Filter,
    RefreshCw,
    AlertTriangle
    } from 'lucide-react'

    import { HeaderWalletControls } from '@/components/HeaderWalletControls'
    import { MainHeader } from '@/components/MainHeader'

    import type { LeaderboardEntry, OrderBookSnapshot } from '@/lib/firebase/types'
    import { convertTimestamps, getLeaderboard } from '@/lib/firebase/firestore'
    import { getOrCreateOrderBookSnapshot } from '@/lib/firebase/offchain-sync'

    const appConfig = new AppConfig(['store_write', 'publish_data'])
    const userSession = new UserSession({ appConfig })

    type TokenCard = {
    symbol: string
    name: string
    price: number
    change: string
    volume: string
    marketCap: string
    holders: number
    trend: 'up' | 'down'
    logo: string
    startupId?: string
    }

    type PortfolioItem = {
    token: string
    amount: number
    value: number
    change: string
    color: string
    }

    type TradeItem = {
    type: 'buy' | 'sell'
    token: string
    amount: number
    price: number
    time: string
    status: 'completed' | 'pending'
    }

    const FALLBACK_TOKENS: TokenCard[] = [
    {
        symbol: 'TECH',
        name: 'TechFlow AI',
        price: 0.045,
        change: '+15.2%',
        volume: '45.2K STX',
        marketCap: '45K',
        holders: 234,
        trend: 'up',
        logo: '🤖'
    },
    {
        symbol: 'GREEN',
        name: 'GreenChain Solutions',
        price: 0.032,
        change: '+8.7%',
        volume: '32.1K STX',
        marketCap: '32K',
        holders: 198,
        trend: 'up',
        logo: '🌱'
    },
    {
        symbol: 'HEALTH',
        name: 'HealthSync Pro',
        price: 0.028,
        change: '+12.4%',
        volume: '28.5K STX',
        marketCap: '28K',
        holders: 167,
        trend: 'up',
        logo: '⚕️'
    },
    {
        symbol: 'LEARN',
        name: 'CryptoLearn',
        price: 0.019,
        change: '+3.1%',
        volume: '19.8K STX',
        marketCap: '19K',
        holders: 145,
        trend: 'up',
        logo: '📚'
    },
    {
        symbol: 'DEV',
        name: 'DevTools Studio',
        price: 0.015,
        change: '+6.8%',
        volume: '15.3K STX',
        marketCap: '15K',
        holders: 123,
        trend: 'up',
        logo: '🛠️'
    },
    {
        symbol: 'FOOD',
        name: 'FoodChain Tracker',
        price: 0.022,
        change: '-2.1%',
        volume: '22.1K STX',
        marketCap: '22K',
        holders: 98,
        trend: 'down',
        logo: '🍎'
    }
    ]

    const FALLBACK_PORTFOLIO: PortfolioItem[] = [
    { token: 'TECH', amount: 1250, value: 56.25, change: '+12.5%', color: 'text-green-600' },
    { token: 'GREEN', amount: 890, value: 28.48, change: '+8.7%', color: 'text-green-600' },
    { token: 'HEALTH', amount: 340, value: 9.52, change: '+12.4%', color: 'text-green-600' },
    { token: 'STX', amount: 150, value: 180, change: '+2.1%', color: 'text-green-600' }
    ]

    const FALLBACK_TRADES: TradeItem[] = [
    { type: 'buy', token: 'TECH', amount: 100, price: 0.044, time: '2 min ago', status: 'completed' },
    { type: 'sell', token: 'GREEN', amount: 50, price: 0.031, time: '5 min ago', status: 'completed' },
    { type: 'buy', token: 'HEALTH', amount: 75, price: 0.027, time: '12 min ago', status: 'completed' },
    { type: 'buy', token: 'LEARN', amount: 200, price: 0.019, time: '18 min ago', status: 'pending' }
    ]

    const toTokenCard = (entry: LeaderboardEntry): TokenCard => {
    const price = typeof entry.tokenPrice === 'number' ? entry.tokenPrice : 0
    const change = entry.priceChange ?? '+0%'
    return {
        symbol: entry.tokenSymbol ?? entry.name.slice(0, 4).toUpperCase(),
        name: entry.name,
        price,
        change,
        volume: entry.platformStats?.views ? `${entry.platformStats.views.toLocaleString()} views` : '--',
        marketCap: entry.marketCap ? `${Math.round(entry.marketCap / 1000)}K` : '--',
        holders: entry.holders ?? 0,
        trend: change.startsWith('-') ? 'down' : 'up',
        logo: entry.tokenSymbol ? entry.tokenSymbol.slice(0, 2) : '🚀',
        startupId: entry.startupId
    }
    }

    export default function Trading() {
    const [userData, setUserData] = useState<UserData | null>(null)
    const [tokens, setTokens] = useState<TokenCard[]>(FALLBACK_TOKENS)
    const [selectedToken, setSelectedToken] = useState<TokenCard | null>(FALLBACK_TOKENS[0] || null)
    const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy')
    const [amount, setAmount] = useState('')
    const [price, setPrice] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [portfolio] = useState<PortfolioItem[]>(FALLBACK_PORTFOLIO)
    const [recentTrades, setRecentTrades] = useState<TradeItem[]>(FALLBACK_TRADES)
    const [orderBook, setOrderBook] = useState<OrderBookSnapshot | null>(null)
    const [orderBookLoading, setOrderBookLoading] = useState(false)
    const [orderBookError, setOrderBookError] = useState<string | null>(null)
    const [isTokenLoading, setIsTokenLoading] = useState(false)

    useEffect(() => {
        if (userSession.isUserSignedIn()) {
        setUserData(userSession.loadUserData())
        }
    }, [])

    useEffect(() => {
        let isMounted = true

        const pullTokens = async () => {
        setIsTokenLoading(true)
        try {
            const entries = await getLeaderboard('overall')
            const normalized = entries.map((entry) => convertTimestamps(entry))
            if (!isMounted || !normalized.length) return
            const mapped = normalized.map((entry) => toTokenCard(entry))
            setTokens(mapped)
            setSelectedToken((current) => current ?? mapped[0] ?? null)
        } catch (error) {
            console.error('Failed to load tokens from Firebase', error)
        } finally {
            if (isMounted) setIsTokenLoading(false)
        }
        }

        pullTokens()

        return () => {
        isMounted = false
        }
    }, [])

    useEffect(() => {
        if (!selectedToken) return
        let isMounted = true

        const pullOrderBook = async () => {
        setOrderBookLoading(true)
        setOrderBookError(null)
        try {
            const snapshot = await getOrCreateOrderBookSnapshot(selectedToken.symbol)
            if (!isMounted) return
            setOrderBook(convertTimestamps(snapshot))
        } catch (error) {
            console.error('Failed to load order book snapshot', error)
            if (isMounted) {
            setOrderBook(null)
            setOrderBookError(error instanceof Error ? error.message : 'Unable to load order book')
            }
        } finally {
            if (isMounted) setOrderBookLoading(false)
        }
        }

        pullOrderBook()

        return () => {
        isMounted = false
        }
    }, [selectedToken])

    const filteredTokens = useMemo(
        () =>
        tokens.filter((token) =>
            token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [tokens, searchQuery]
    )

    const portfolioValue = useMemo(
        () => portfolio.reduce((total, item) => total + item.value, 0),
        [portfolio]
    )

    const handleTrade = () => {
        if (!selectedToken || !amount || !price) {
        alert('Please fill all fields')
        return
        }

        const newTrade: TradeItem = {
        type: orderType,
        token: selectedToken.symbol,
        amount: parseFloat(amount),
        price: parseFloat(price),
        time: 'just now',
        status: 'pending'
        }

        setRecentTrades((prev) => [newTrade, ...prev])
        setAmount('')
        setPrice('')

        setTimeout(() => {
        setRecentTrades((prev) =>
            prev.map((trade) =>
            trade.time === 'just now' ? { ...trade, status: 'completed', time: '1 min ago' } : trade
            )
        )
        }, 2000)
    }

    const topBids = orderBook?.bids?.slice(0, 5) ?? []
    const topAsks = orderBook?.asks?.slice(0, 5) ?? []

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100">
        <MainHeader
            highlightPath="/trading"
            rightSlot={
            <>
                <HeaderWalletControls />
                {userData && (
                <div className="flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full">
                    <Wallet className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">${portfolioValue.toFixed(2)}</span>
                </div>
                )}
            </>
            }
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900">
                Token
                <span className="block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                Trading
                </span>
            </h1>
            <p className="text-xl text-gray-600">Trade startup tokens and build your investment portfolio</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-2">
                <Wallet className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">Portfolio Value</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">${portfolioValue.toFixed(2)}</div>
                <div className="text-sm text-green-600 font-medium">+8.7% today</div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600">24h Change</span>
                </div>
                <div className="text-3xl font-bold text-green-600">+$12.45</div>
                <div className="text-sm text-green-600 font-medium">+4.8%</div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-2">
                <Coins className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-600">Total Tokens</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{portfolio.length}</div>
                <div className="text-sm text-gray-600">Different assets</div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-2">
                <Activity className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium text-gray-600">Active Trades</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">2</div>
                <div className="text-sm text-orange-600 font-medium">Pending orders</div>
            </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex space-x-4">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                    type="text"
                    placeholder="Search tokens..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                </div>
                <button className="px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:border-orange-500 transition-colors">
                    <Filter className="w-5 h-5 text-gray-600" />
                </button>
                </div>

                {isTokenLoading && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" />
                    <span>Loading market data from Firebase…</span>
                </div>
                )}

                <div className="space-y-4">
                {filteredTokens.map((token) => (
                    <div
                    key={token.symbol}
                    className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedToken(token)}
                    >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl flex items-center justify-center text-2xl">
                            {token.logo}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{token.name}</h3>
                            <p className="text-sm text-gray-600">{token.symbol}</p>
                        </div>
                        </div>

                        <div className="text-right space-y-1">
                        <div className="text-2xl font-bold text-gray-900">${token.price.toFixed(3)}</div>
                        <div className={`text-sm font-medium ${token.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {token.change}
                        </div>
                        </div>

                        <div className="text-right space-y-1 text-sm text-gray-500">
                        <div>Vol: {token.volume}</div>
                        <div>Cap: ${token.marketCap}</div>
                        <div>{token.holders} holders</div>
                        </div>

                        <div className="flex space-x-2">
                        <button
                            onClick={(e) => {
                            e.stopPropagation()
                            setSelectedToken(token)
                            setOrderType('buy')
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all"
                        >
                            Buy
                        </button>
                        <button
                            onClick={(e) => {
                            e.stopPropagation()
                            setSelectedToken(token)
                            setOrderType('sell')
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all"
                        >
                            Sell
                        </button>
                        </div>
                    </div>
                    </div>
                ))}

                {filteredTokens.length === 0 && (
                    <div className="bg-white/70 border border-dashed border-orange-300 rounded-2xl p-12 text-center text-gray-500">
                    No token matches the current search.
                    </div>
                )}
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Place Order</h3>

                {selectedToken ? (
                    <div className="space-y-6">
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                        <div className="text-2xl">{selectedToken.logo}</div>
                        <div>
                        <div className="font-bold text-gray-900">{selectedToken.symbol}</div>
                        <div className="text-sm text-gray-600">{selectedToken.name}</div>
                        <div className="text-lg font-bold text-gray-900">${selectedToken.price.toFixed(3)}</div>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <button
                        onClick={() => setOrderType('buy')}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                            orderType === 'buy'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        >
                        Buy
                        </button>
                        <button
                        onClick={() => setOrderType('sell')}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                            orderType === 'sell'
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        >
                        Sell
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                        />
                        </div>

                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price (STX)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder={selectedToken.price.toFixed(3)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                        />
                        </div>
                    </div>

                    {amount && price && (
                        <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Total:</span>
                            <span className="font-bold">{(parseFloat(amount) * parseFloat(price || '0')).toFixed(3)} STX</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Fee:</span>
                            <span>0.1%</span>
                        </div>
                        </div>
                    )}

                    <button
                        onClick={handleTrade}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                        orderType === 'buy'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                            : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                        }`}
                    >
                        {orderType === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
                    </button>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                    <Coins className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a token to start trading</p>
                    </div>
                )}
                </div>

                {selectedToken && (
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Order Book Snapshot</h3>
                    {orderBookLoading && <span className="text-sm text-gray-500">Updating…</span>}
                    </div>

                    {orderBookError && (
                    <div className="flex items-center space-x-2 text-sm text-red-600 mb-4">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{orderBookError}</span>
                    </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Bids</h4>
                        <div className="space-y-2">
                        {topBids.length === 0 && <div className="text-xs text-gray-500">No bids yet</div>}
                        {topBids.map((bid, index) => (
                            <div key={index} className="flex justify-between text-sm px-3 py-2 bg-green-50 rounded-lg">
                            <span className="font-medium text-green-700">{bid.amount} tokens</span>
                            <span className="text-green-600">@ {bid.price} STX</span>
                            </div>
                        ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Asks</h4>
                        <div className="space-y-2">
                        {topAsks.length === 0 && <div className="text-xs text-gray-500">No asks yet</div>}
                        {topAsks.map((ask, index) => (
                            <div key={index} className="flex justify-between text-sm px-3 py-2 bg-red-50 rounded-lg">
                            <span className="font-medium text-red-700">{ask.amount} tokens</span>
                            <span className="text-red-600">@ {ask.price} STX</span>
                            </div>
                        ))}
                        </div>
                    </div>
                    </div>

                    {orderBook?.lastTrade && (
                    <div className="mt-4 text-xs text-gray-500">
                        Last trade: {orderBook.lastTrade.type} {orderBook.lastTrade.amount} @ {orderBook.lastTrade.price} STX ·
                        {new Date(orderBook.lastTrade.timestamp).toLocaleTimeString()}
                    </div>
                    )}
                </div>
                )}

                <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Your Portfolio</h3>
                <div className="space-y-4">
                    {portfolio.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                        <div className="font-medium text-gray-900">{item.token}</div>
                        <div className="text-sm text-gray-500">{item.amount} tokens</div>
                        </div>
                        <div className="text-right">
                        <div className="font-bold text-gray-900">${item.value.toFixed(2)}</div>
                        <div className={`text-sm ${item.color}`}>{item.change}</div>
                        </div>
                    </div>
                    ))}
                </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Recent Trades</h3>
                    <RefreshCw className="w-5 h-5 text-gray-400 cursor-pointer hover:text-orange-500" />
                </div>
                <div className="space-y-3">
                    {recentTrades.map((trade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                            <div className="font-medium text-gray-900">
                            {trade.type.toUpperCase()} {trade.token}
                            </div>
                            <div className="text-sm text-gray-500">{trade.time}</div>
                        </div>
                        </div>
                        <div className="text-right">
                        <div className="text-sm font-medium">{trade.amount} @ ${trade.price.toFixed(3)}</div>
                        <div
                            className={`text-xs px-2 py-1 rounded-full ${
                            trade.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                        >
                            {trade.status}
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            </div>
            </div>
        </div>
        </div>
    )
    }