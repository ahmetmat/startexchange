    'use client'

    import { useEffect, useMemo, useState } from 'react'
    import {
    Trophy, Calendar, Users, Coins, Filter, Search, Award, Clock, TrendingUp,
    Star, Eye, ArrowRight, Play, Target, Zap, Crown, Medal, Gift
    } from 'lucide-react'

    import { useWallet } from '@txnlab/use-wallet-react'
    import MainHeader from '../components/MainHeader'
    import { DonationModal } from '../DonationModal'
    import { sendAlgo } from '../services/algorand/client' // <- servis katmanı

    const MIN_DONATION_ALGO = 1
    const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS ?? 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ' // örnek

    type CompetitionStatus = 'active' | 'upcoming' | 'ended'

    type CompetitionDonation = {
    id: string
    donor: string
    amount: number
    timestamp: string
    txId: string
    recipient: string
    }

    type CompetitionState = {
    id: number
    name: string
    description: string
    status: CompetitionStatus
    type: string
    startDate: string
    endDate: string
    participants: number
    prizePool: string
    currency: string
    category: string
    difficulty: 'Low' | 'Medium' | 'High'
    requirements: string[]
    prizes: { first: string; second: string; third: string }
    metrics: string[]
    joined: boolean
    myRank?: number
    daysLeft?: number
    registrationEnds?: string
    featured: boolean
    maxParticipants?: number
    donationPool: {
        isOpen: boolean
        poolBalance: number
        donations: CompetitionDonation[]
        winner?: string
        winnerDeclaredAt?: string
    }
    }

    export default function Competitions() {
    const { activeAccount } = useWallet()
    const walletAddress = activeAccount?.address ?? null
    const isConnected = !!walletAddress
    const isAdmin = isConnected && walletAddress === ADMIN_ADDRESS

    const [selectedFilter, setSelectedFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    const [competitions, setCompetitions] = useState<CompetitionState[]>([
        {
        id: 1,
        name: 'January Growth Challenge',
        description:
            'Compete for the highest growth metrics this month. Track your GitHub activity, social media growth, and platform engagement.',
        status: 'active',
        type: 'monthly',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        participants: 127,
        prizePool: '15000',
        currency: 'ALGO',
        category: 'Growth',
        difficulty: 'Medium',
        requirements: [
            'Active GitHub repository',
            'Social media presence',
            'Minimum 30 days since launch',
        ],
        prizes: { first: '7500 ALGO', second: '4500 ALGO', third: '3000 ALGO' },
        metrics: ['GitHub commits', 'Stars gained', 'Twitter followers', 'Platform posts'],
        joined: true,
        myRank: 3,
        daysLeft: 12,
        featured: true,
        donationPool: { isOpen: true, poolBalance: 0, donations: [] },
        },
        {
        id: 2,
        name: 'Demo Day Showcase',
        description:
            'Present your latest product demo to investors and the community. Best demos win funding opportunities.',
        status: 'upcoming',
        type: 'event',
        startDate: '2025-02-15',
        endDate: '2025-02-15',
        participants: 0,
        maxParticipants: 50,
        prizePool: '25000',
        currency: 'ALGO',
        category: 'Demo',
        difficulty: 'High',
        requirements: ['Working product demo', 'Pitch deck', 'Video presentation under 5 minutes'],
        prizes: {
            first: '15000 ALGO + Investor Meetings',
            second: '7000 ALGO + Mentorship',
            third: '3000 ALGO + Community Recognition',
        },
        metrics: ['Demo quality', 'Investor votes', 'Community engagement'],
        joined: false,
        registrationEnds: '2025-02-10',
        featured: true,
        donationPool: { isOpen: false, poolBalance: 0, donations: [] },
        },
        {
        id: 3,
        name: 'AI Innovation Sprint',
        description:
            'Build innovative AI features for your startup. Focus on practical implementation and user impact.',
        status: 'upcoming',
        type: 'sprint',
        startDate: '2025-02-01',
        endDate: '2025-02-07',
        participants: 23,
        maxParticipants: 100,
        prizePool: '10000',
        currency: 'ALGO',
        category: 'Innovation',
        difficulty: 'High',
        requirements: ['AI/ML integration', 'Technical documentation', 'User testing results'],
        prizes: { first: '5000 ALGO', second: '3000 ALGO', third: '2000 ALGO' },
        metrics: ['Technical innovation', 'User impact', 'Code quality'],
        joined: false,
        featured: false,
        donationPool: { isOpen: false, poolBalance: 0, donations: [] },
        },
        {
        id: 4,
        name: 'Community Building Contest',
        description:
            'Grow and engage your startup community. Build meaningful connections with users and supporters.',
        status: 'active',
        type: 'ongoing',
        startDate: '2025-01-15',
        endDate: '2025-03-15',
        participants: 89,
        prizePool: '8000',
        currency: 'ALGO',
        category: 'Community',
        difficulty: 'Low',
        requirements: ['Active community channels', 'Regular user engagement', 'Content creation'],
        prizes: { first: '4000 ALGO', second: '2500 ALGO', third: '1500 ALGO' },
        metrics: ['Community growth', 'Engagement rate', 'Content quality'],
        joined: false,
        daysLeft: 45,
        featured: false,
        donationPool: { isOpen: true, poolBalance: 0, donations: [] },
        },
    ])

    const filteredCompetitions = useMemo(() => {
        const loweredSearch = searchQuery.toLowerCase()
        return competitions.filter((comp) => {
        const matchesSearch =
            comp.name.toLowerCase().includes(loweredSearch) ||
            comp.category.toLowerCase().includes(loweredSearch)

        if (selectedFilter === 'all') return matchesSearch
        if (selectedFilter === 'active') return comp.status === 'active' && matchesSearch
        if (selectedFilter === 'upcoming') return comp.status === 'upcoming' && matchesSearch
        if (selectedFilter === 'joined') return comp.joined && matchesSearch
        return matchesSearch
        })
    }, [competitions, searchQuery, selectedFilter])

    const competitionTotals = useMemo(() => {
        const totalBalance = competitions.reduce((t, c) => t + c.donationPool.poolBalance, 0)
        const openPools = competitions.filter((c) => c.donationPool.isOpen).length
        const totalDonations = competitions.reduce((t, c) => t + c.donationPool.donations.length, 0)
        return { totalBalance, openPools, totalDonations }
    }, [competitions])

    const [activeDonation, setActiveDonation] = useState<CompetitionState | null>(null)

    const openDonationModal = (competitionId: number) => {
        if (!isConnected) {
        window.alert('Bağış yapabilmek için önce cüzdanınızı bağlamanız gerekiyor.')
        return
        }
        const target = competitions.find((c) => c.id === competitionId)
        if (target) setActiveDonation(target)
    }
    const closeDonationModal = () => setActiveDonation(null)

    const handleCompetitionDonation = async (competitionId: number, amount: number, txId: string) => {
        const timestamp = new Date().toISOString()
        const donationId = `donation-${competitionId}-${Date.now()}`
        let donationRecord: CompetitionDonation | null = null

        setCompetitions((prev) =>
        prev.map((c) => {
            if (c.id !== competitionId) return c
            donationRecord = {
            id: donationId,
            donor: `supporter-${String(c.donationPool.donations.length + 1).padStart(3, '0')}`,
            amount,
            timestamp,
            txId,
            recipient: ADMIN_ADDRESS,
            }
            return {
            ...c,
            donationPool: {
                ...c.donationPool,
                poolBalance: Number((c.donationPool.poolBalance + amount).toFixed(2)),
                donations: [donationRecord!, ...c.donationPool.donations],
            },
            }
        }),
        )

        if (donationRecord) setActiveDonation(null)
    }

    const setRoundStatus = (competitionId: number, isOpen: boolean) => {
        setCompetitions((prev) =>
        prev.map((c) =>
            c.id === competitionId ? { ...c, donationPool: { ...c.donationPool, isOpen } } : c,
        ),
        )
        setActiveDonation((prev) =>
        prev && prev.id === competitionId ? { ...prev, donationPool: { ...prev.donationPool, isOpen } } : prev,
        )
    }

    const declareWinner = (competitionId: number) => {
        const comp = competitions.find((c) => c.id === competitionId)
        if (!comp) return
        const winner = window.prompt('Kazanan girişimin adı veya kimliği nedir?')?.trim()
        if (!winner) return
        const declaredAt = new Date().toISOString()

        setCompetitions((prev) =>
        prev.map((c) =>
            c.id === competitionId
            ? { ...c, donationPool: { ...c.donationPool, isOpen: false, winner, winnerDeclaredAt: declaredAt } }
            : c,
        ),
        )
        setActiveDonation((prev) =>
        prev && prev.id === competitionId
            ? { ...prev, donationPool: { ...prev.donationPool, isOpen: false, winner, winnerDeclaredAt: declaredAt } }
            : prev,
        )
    }

    const CompetitionCard = ({
        competition,
        onDonate,
        onOpenRound,
        onCloseRound,
        onDeclareWinner,
    }: {
        competition: CompetitionState
        onDonate: (competitionId: number) => void
        onOpenRound: (competitionId: number) => void
        onCloseRound: (competitionId: number) => void
        onDeclareWinner: (competitionId: number) => void
    }) => {
        const isActive = competition.status === 'active'
        const isUpcoming = competition.status === 'upcoming'
        const isJoined = competition.joined
        const pool = competition.donationPool
        const donorsCount = pool.donations.length

        return (
        <div
            className={`rounded-3xl border-2 p-8 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
            competition.featured ? 'border-orange-300 bg-gradient-to-br from-orange-50/50 to-red-50/50' : 'border-gray-200 bg-white/80'
            }`}
        >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
            <div className="flex items-start space-x-4">
                <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                    isActive
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : isUpcoming
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        : 'bg-gradient-to-r from-gray-500 to-gray-600'
                }`}
                >
                {competition.category === 'Growth' && <TrendingUp className="h-8 w-8 text-white" />}
                {competition.category === 'Demo' && <Play className="h-8 w-8 text-white" />}
                {competition.category === 'Innovation' && <Zap className="h-8 w-8 text-white" />}
                {competition.category === 'Community' && <Users className="h-8 w-8 text-white" />}
                </div>
                <div className="space-y-2">
                <div className="flex items-center space-x-3">
                    <h3 className="text-2xl font-bold text-gray-900">{competition.name}</h3>
                    {competition.featured && (
                    <div className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1">
                        <Crown className="h-4 w-4 text-white" />
                    </div>
                    )}
                </div>
                <p className="max-w-2xl leading-relaxed text-gray-600">{competition.description}</p>
                </div>
            </div>

            <div className="space-y-2 text-right">
                <span
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                    isActive ? 'bg-green-100 text-green-800' : isUpcoming ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}
                >
                {isActive ? 'ACTIVE' : isUpcoming ? 'UPCOMING' : 'ENDED'}
                </span>
                {isJoined && (
                <div className="flex items-center space-x-1 text-sm font-medium text-orange-600">
                    <Award className="h-4 w-4" />
                    <span>Joined</span>
                </div>
                )}
            </div>
            </div>

            {/* Stats Row */}
            <div className="mb-6 grid grid-cols-4 gap-4">
            <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-gray-900">{competition.participants}</div>
                <div className="text-sm text-gray-500">Participants</div>
            </div>
            <div className="space-y-1 text-center">
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-2xl font-bold text-transparent">
                {competition.prizePool}
                </div>
                <div className="text-sm text-gray-500">{competition.currency} Prize</div>
            </div>
            <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-gray-900">
                {competition.difficulty === 'Low' && '⭐'}
                {competition.difficulty === 'Medium' && '⭐⭐'}
                {competition.difficulty === 'High' && '⭐⭐⭐'}
                </div>
                <div className="text-sm text-gray-500">{competition.difficulty}</div>
            </div>
            <div className="space-y-1 text-center">
                <div className="text-2xl font-bold text-gray-900">
                {competition.daysLeft
                    ? competition.daysLeft
                    : isUpcoming
                    ? new Date(competition.startDate).getDate() - new Date().getDate()
                    : '--'}
                </div>
                <div className="text-sm text-gray-500">Days Left</div>
            </div>
            </div>

            {/* Donation Pool Overview */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 rounded-2xl border border-orange-200 bg-white/70 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500">
                <Coins className="h-6 w-6 text-white" />
                </div>
                <div>
                <p className="text-xs text-gray-500">Paylaşılan Havuz</p>
                <p className="text-lg font-bold text-gray-900">{competition.donationPool.poolBalance.toFixed(2)} ALGO</p>
                </div>
            </div>

            <div className="flex items-center space-x-3 rounded-2xl border border-orange-200 bg-white/70 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                <p className="text-xs text-gray-500">Bağışçılar</p>
                <p className="text-lg font-bold text-gray-900">{donorsCount}</p>
                {donorsCount > 0 && (
                    <p className="text-xs text-gray-500">
                    Son bağış: {new Date(pool.donations[0]?.timestamp ?? '').toLocaleString()}
                    </p>
                )}
                </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-orange-200 bg-white/70 p-4">
                <div>
                <p className="text-xs text-gray-500">Bağış Turu</p>
                <p className={`text-lg font-bold ${pool.isOpen ? 'text-green-600' : 'text-gray-700'}`}>
                    {pool.isOpen ? 'Açık' : 'Kapalı'}
                </p>
                {pool.winner && (
                    <div className="mt-1 flex items-center space-x-1 text-xs text-orange-600">
                    <Star className="h-4 w-4" />
                    <span>Kazanan: {pool.winner}</span>
                    </div>
                )}
                </div>
                <div className="text-gray-400">
                <Eye className="h-6 w-6" />
                </div>
            </div>
            </div>

            {donorsCount > 0 && (
            <div className="mb-6">
                <h4 className="mb-2 font-semibold text-gray-900">Son Bağışlar</h4>
                <div className="space-y-2">
                {pool.donations.slice(0, 3).map((d) => (
                    <div
                    key={d.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white/60 px-4 py-2 text-sm text-gray-600"
                    >
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{d.donor}</span>
                        <span className="text-[10px] text-gray-400">TX: {(d.txId ?? '').slice(0, 10)}…</span>
                    </div>
                    <div className="space-y-1 text-right text-xs text-gray-500">
                        <div className="font-semibold text-gray-900">{d.amount.toFixed(2)} ALGO</div>
                        <div>{new Date(d.timestamp).toLocaleTimeString()}</div>
                        <div>{(d.recipient ?? ADMIN_ADDRESS).slice(0, 10)}…</div>
                    </div>
                    </div>
                ))}
                </div>
            </div>
            )}

            {/* Prize Breakdown */}
            <div className="mb-6">
            <h4 className="mb-3 font-semibold text-gray-900">Prize Distribution</h4>
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-yellow-200 bg-gradient-to-r from-yellow-100 to-orange-100 p-3 text-center">
                <Medal className="mx-auto mb-1 h-5 w-5 text-yellow-600" />
                <div className="text-sm font-medium text-yellow-800">1st Place</div>
                <div className="text-xs text-yellow-700">{competition.prizes.first}</div>
                </div>
                <div className="rounded-xl border border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 p-3 text-center">
                <Medal className="mx-auto mb-1 h-5 w-5 text-gray-600" />
                <div className="text-sm font-medium text-gray-800">2nd Place</div>
                <div className="text-xs text-gray-700">{competition.prizes.second}</div>
                </div>
                <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-100 to-red-100 p-3 text-center">
                <Medal className="mx-auto mb-1 h-5 w-5 text-orange-600" />
                <div className="text-sm font-medium text-orange-800">3rd Place</div>
                <div className="text-xs text-orange-700">{competition.prizes.third}</div>
                </div>
            </div>
            </div>

            {/* Metrics & Requirements */}
            <div className="mb-6 grid gap-6 md:grid-cols-2">
            <div>
                <h4 className="mb-2 font-semibold text-gray-900">Judging Criteria</h4>
                <div className="space-y-1">
                {competition.metrics.map((m, i) => (
                    <div key={i} className="flex items-center space-x-2 text-sm text-gray-600">
                    <Target className="h-3 w-3 text-orange-500" />
                    <span>{m}</span>
                    </div>
                ))}
                </div>
            </div>
            <div>
                <h4 className="mb-2 font-semibold text-gray-900">Requirements</h4>
                <div className="space-y-1">
                {competition.requirements.slice(0, 2).map((r, i) => (
                    <div key={i} className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span>{r}</span>
                    </div>
                ))}
                {competition.requirements.length > 2 && (
                    <div className="text-xs text-gray-500">+{competition.requirements.length - 2} more</div>
                )}
                </div>
            </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                    {new Date(competition.startDate).toLocaleDateString()} -{' '}
                    {new Date(competition.endDate).toLocaleDateString()}
                </span>
                </span>
                <span className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{pool.isOpen ? 'Bağış turu açık' : 'Bağış turu kapalı'}</span>
                </span>
            </div>

            <div className="flex flex-col items-end gap-3">
                <div className="flex flex-wrap justify-end gap-3">
                <button
                    onClick={() => onDonate(competition.id)}
                    disabled={!pool.isOpen}
                    className={`flex items-center space-x-2 rounded-xl px-6 py-3 font-semibold transition-all ${
                    pool.isOpen
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:from-orange-600 hover:to-red-600'
                        : 'cursor-not-allowed bg-gray-200 text-gray-500'
                    }`}
                >
                    <Coins className="h-4 w-4" />
                    <span>Bağış Yap (≥ {MIN_DONATION_ALGO} ALGO)</span>
                </button>

                <button className="rounded-xl border-2 border-gray-300 px-6 py-3 font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50">
                    View Details
                </button>

                {!isJoined ? (
                    <button
                    className={`flex items-center space-x-2 rounded-xl px-8 py-3 font-bold transition-all duration-300 hover:scale-105 ${
                        isActive
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:from-green-600 hover:to-emerald-600'
                        : isUpcoming
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:from-blue-600 hover:to-cyan-600'
                            : 'cursor-not-allowed bg-gray-300 text-gray-500'
                    }`}
                    >
                    <span>{isActive ? 'Join Now' : isUpcoming ? 'Register' : 'Ended'}</span>
                    {(isActive || isUpcoming) && <ArrowRight className="h-4 w-4" />}
                    </button>
                ) : (
                    <button className="cursor-default rounded-xl border-2 border-orange-300 bg-orange-100 px-8 py-3 font-bold text-orange-700">
                    <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4" />
                        <span>Rank #{competition.myRank}</span>
                    </div>
                    </button>
                )}
                </div>

                <div className="flex flex-wrap justify-end gap-3 text-xs text-gray-500">
                <span>Bağışlar yarışma havuzuna eklenir ve tur kapandığında kazanan açıklanır.</span>
                <span>Minimum bağış {MIN_DONATION_ALGO} ALGO.</span>
                <span>Hedef hesap: {ADMIN_ADDRESS.slice(0, 10)}…</span>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-gray-500">
                <span className="inline-flex items-center space-x-1 font-medium text-gray-600">
                    <Filter className="h-3 w-3" />
                    <span>Yönetici Kontrolleri</span>
                </span>
                {isAdmin ? (
                    <>
                    <button
                        onClick={() => onOpenRound(competition.id)}
                        disabled={pool.isOpen}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        pool.isOpen ? 'cursor-not-allowed border-gray-200 text-gray-300' : 'border-green-200 text-green-600 hover:border-green-300'
                        } border`}
                    >
                        Turu Aç
                    </button>
                    <button
                        onClick={() => onCloseRound(competition.id)}
                        disabled={!pool.isOpen}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        pool.isOpen ? 'border-red-200 text-red-600 hover:border-red-300' : 'cursor-not-allowed border-gray-200 text-gray-300'
                        } border`}
                    >
                        Turu Kapat
                    </button>
                    <button
                        onClick={() => onDeclareWinner(competition.id)}
                        disabled={pool.donations.length === 0 || !!pool.winner}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        pool.donations.length === 0 || !!pool.winner
                            ? 'cursor-not-allowed border-gray-200 text-gray-300'
                            : 'border-orange-200 text-orange-600 hover:border-orange-300'
                        } border`}
                    >
                        Kazananı Açıkla
                    </button>
                    </>
                ) : (
                    <span className="text-xs text-gray-400">
                    {isConnected
                        ? `Bu kontroller yalnızca yönetici (${ADMIN_ADDRESS}) tarafından kullanılabilir.`
                        : 'Yönetici kontrollerini görmek için cüzdanınızı bağlayın.'}
                    </span>
                )}
                </div>
            </div>
            </div>
        </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100">
        <MainHeader highlightPath="/competitions" rightSlot={<HeaderWalletControls />} />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="mb-12 space-y-6 text-center">
            <div className="inline-flex items-center space-x-2 rounded-full border border-orange-200 bg-gradient-to-r from-yellow-100 to-orange-100 px-6 py-3">
                <Trophy className="h-5 w-5 animate-pulse text-orange-500" />
                <span className="font-semibold text-orange-700">Compete & Win</span>
            </div>

            <h1 className="text-5xl font-black text-gray-900 md:text-6xl">
                Startup
                <span className="block bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent">
                Competitions
                </span>
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
                Join exciting competitions, showcase your startup, and compete for amazing prizes.
                Build your community while growing your business.
            </p>
            </div>

            {/* Filters and Search */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                type="text"
                placeholder="Search competitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white/80 px-12 py-3 backdrop-blur-sm transition-all focus:outline-none focus:border-orange-500"
                />
            </div>

            <div className="flex space-x-2">
                {[
                { key: 'all', label: 'All', icon: Trophy },
                { key: 'active', label: 'Active', icon: Play },
                { key: 'upcoming', label: 'Upcoming', icon: Clock },
                { key: 'joined', label: 'Joined', icon: Award },
                ].map(({ key, label, icon: Icon }) => (
                <button
                    key={key}
                    onClick={() => setSelectedFilter(key)}
                    className={`flex items-center space-x-2 rounded-xl px-6 py-3 font-medium transition-all ${
                    selectedFilter === key
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                        : 'border border-gray-200 bg-white/80 text-gray-600 backdrop-blur-sm hover:border-orange-300 hover:text-orange-600'
                    }`}
                >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                </button>
                ))}
            </div>
            </div>

            {/* Donation Summary */}
            <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 rounded-2xl border border-orange-200 bg-white/80 p-5 backdrop-blur">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500">
                <Coins className="h-6 w-6 text-white" />
                </div>
                <div>
                <p className="text-xs text-gray-500">Toplam Havuz Büyüklüğü</p>
                <p className="text-xl font-bold text-gray-900">
                    {competitionTotals.totalBalance.toFixed(2)} ALGO
                </p>
                </div>
            </div>
            <div className="flex items-center space-x-3 rounded-2xl border border-orange-200 bg-white/80 p-5 backdrop-blur">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500">
                <Eye className="h-6 w-6 text-white" />
                </div>
                <div>
                <p className="text-xs text-gray-500">Açık Bağış Turları</p>
                <p className="text-xl font-bold text-gray-900">{competitionTotals.openPools}</p>
                </div>
            </div>
            <div className="flex items-center space-x-3 rounded-2xl border border-orange-200 bg-white/80 p-5 backdrop-blur">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-green-500">
                <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                <p className="text-xs text-gray-500">Toplam Bağış</p>
                <p className="text-xl font-bold text-gray-900">{competitionTotals.totalDonations}</p>
                </div>
            </div>
            </div>

            {/* Competitions */}
            <div className="space-y-8">
            {filteredCompetitions.map((c) => (
                <CompetitionCard
                key={c.id}
                competition={c}
                onDonate={openDonationModal}
                onOpenRound={(id) => setRoundStatus(id, true)}
                onCloseRound={(id) => setRoundStatus(id, false)}
                onDeclareWinner={declareWinner}
                />
            ))}

            {filteredCompetitions.length === 0 && (
                <div className="space-y-4 py-16 text-center">
                <Trophy className="mx-auto h-16 w-16 text-gray-300" />
                <h3 className="text-2xl font-bold text-gray-400">No competitions found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
            )}
            </div>

            {/* Donation Modal */}
            <DonationModal
            isOpen={!!activeDonation}
            onClose={closeDonationModal}
            minAmount={MIN_DONATION_ALGO}
            title={activeDonation ? `${activeDonation.name} için bağış yap` : 'Bağış Yap'}
            description={
                activeDonation
                ? `${activeDonation.name} bağışları yarışma havuzuna eklenir. (Hedef hesap: ${ADMIN_ADDRESS})`
                : `Bağışlar yarışma havuzuna yönlendirilir. (Hedef hesap: ${ADMIN_ADDRESS})`
            }
            onConfirm={async (amount /* no txId */) => {
                if (!activeDonation) return
                // 1) On-chain gönder (ALGO)
                const txId = await sendAlgo({
                to: ADMIN_ADDRESS,
                amountAlgo: amount,
                note: `StartEx:comp#${activeDonation.id}`,
                })
                // 2) UI state’ini güncelle
                await handleCompetitionDonation(activeDonation.id, amount, txId)
            }}
            />

            {/* CTA */}
            <div className="mt-16 rounded-3xl bg-gradient-to-r from-orange-100 via-red-50 to-pink-100 p-12 text-center">
            <div className="space-y-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500">
                <Gift className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900">Ready to Compete?</h2>
                <p className="mx-auto max-w-2xl text-xl text-gray-600">
                Join competitions, win prizes, and grow your startup with the StartEx community
                </p>
                <button className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-10 py-4 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:from-orange-600 hover:to-red-600">
                Get Started Today
                </button>
            </div>
            </div>
        </div>
        </div>
    )
    }