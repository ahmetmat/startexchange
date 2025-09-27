    'use client'

    import { useEffect, useMemo, useState } from 'react'
    import type { ComponentType } from 'react'
    import { useSearchParams } from 'next/navigation'
    import {
    Rocket, TrendingUp, Users, Github, Twitter, Globe, Trophy, Coins,
    Activity, Settings, Eye, GitCommit, Star, GitFork, Play, Award
    } from 'lucide-react'

    import { useWallet } from '@txnlab/use-wallet-react'
    import { HeaderWalletControls } from '@/components/HeaderWalletControls'
    import { MainHeader } from '../components/MainHeader'

    import type {
    StartupProfile,
    MetricSnapshot,
    StartupSocialPost,
    NotificationPreference,
    } from '@/lib/firebase/types'
    import {
    listStartupProfiles,
    getLatestMetricSnapshot,
    fetchStartupPosts,
    getNotificationPreferences,
    setNotificationPreferences as saveNotificationPreferences,
    convertTimestamps,
    getStartupProfile,
    getLatestStartupByOwner,
    } from '@/lib/firebase/firestore'

    const FALLBACK_STARTUP = {
    id: 'fallback-startup',
    ownerAddress: 'guest-user',
    name: 'TechStartup',
    description: 'Revolutionary AI-powered platform for developers',
    githubRepo: 'https://github.com/user/techstartup',
    website: 'https://techstartup.io',
    twitter: '@techstartup',
    tokenName: 'TechCoin',
    tokenSymbol: 'TECH',
    totalSupply: 1_000_000,
    price: 0.025,
    marketCap: 25_000,
    holders: 156,
    rank: 8,
    score: 2450,
    verified: true,
    }

    const FALLBACK_METRICS = {
    github: { commits: 234, stars: 89, forks: 23, lastCommit: '2 hours ago' },
    social: { twitterFollowers: 1250, linkedinFollowers: 890 },
    platform: { posts: 12, demoViews: 3400 },
    }

    const FALLBACK_COMPETITIONS = [
    {
        id: 1,
        name: 'January Growth Challenge',
        description: 'Compete for the highest growth metrics this month',
        status: 'active' as const,
        endDate: '2025-01-31',
        participants: 45,
        prizePool: '5000 ALGO',
        myRank: 3,
        joined: true,
    },
    {
        id: 2,
        name: 'Demo Day Competition',
        description: 'Showcase your latest features and demos',
        status: 'upcoming' as const,
        startDate: '2025-02-01',
        participants: 0,
        prizePool: '10000 ALGO',
        joined: false,
    },
    ]

    const defaultNotificationPrefs: NotificationPreference = {
    allowEmail: true,
    allowPush: true,
    email: '',
    }

    const formatDateTime = (value: unknown) => {
    if (!value) return 'Just now'
    try {
        const date =
        value instanceof Date
            ? value
            : typeof value === 'string'
            ? new Date(value)
            : new Date(Number(value))
        if (Number.isNaN(date.getTime())) return 'Just now'
        return date.toLocaleString()
    } catch {
        return 'Just now'
    }
    }

    export default function Dashboard() {
    const { activeAccount } = useWallet()
    const walletAddress = activeAccount?.address ?? null

    const [selectedTab, setSelectedTab] =
        useState<'overview' | 'metrics' | 'competitions' | 'token' | 'settings'>('overview')
    const [startupData, setStartupData] = useState(FALLBACK_STARTUP)
    const [metrics, setMetrics] = useState(FALLBACK_METRICS)
    const [competitions] = useState(FALLBACK_COMPETITIONS)
    const [startupPosts, setStartupPosts] = useState<StartupSocialPost[]>([])
    const [notificationPrefs, setNotificationPrefs] =
        useState<NotificationPreference>(defaultNotificationPrefs)
    const [notificationPrefsLoaded, setNotificationPrefsLoaded] = useState(false)
    const [savingNotifications, setSavingNotifications] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const searchParams = useSearchParams()
    const startupIdParam = searchParams.get('startupId') ?? null

    useEffect(() => {
        let isMounted = true
        const loadDashboardData = async () => {
        setIsLoading(true)
        setError(null)

        try {
            let selectedProfile: StartupProfile | null = null

            if (startupIdParam) {
            const byId = await getStartupProfile(startupIdParam)
            if (byId) selectedProfile = byId
            }

            if (!selectedProfile && walletAddress) {
            const latestByOwner = await getLatestStartupByOwner(walletAddress)
            if (latestByOwner) selectedProfile = latestByOwner
            }

            if (!selectedProfile) {
            const profiles = await listStartupProfiles(1)
            if (profiles.length > 0) selectedProfile = profiles[0]
            }

            if (!isMounted) return

            if (!selectedProfile) {
            setStartupData(FALLBACK_STARTUP)
            setMetrics(FALLBACK_METRICS)
            setStartupPosts([])
            setNotificationPrefs(defaultNotificationPrefs)
            setNotificationPrefsLoaded(true)
            return
            }

            const normalized = convertTimestamps<StartupProfile>(selectedProfile)
            const derivedPrice = normalized.score
            ? Number((normalized.score / 100000).toFixed(3))
            : FALLBACK_STARTUP.price
            const derivedMarketCap =
            normalized.circulatingSupply && normalized.score
                ? Math.round((normalized.circulatingSupply ?? 0) * (normalized.score / 100000))
                : FALLBACK_STARTUP.marketCap

            setStartupData({
            ...FALLBACK_STARTUP,
            id: normalized.id,
            ownerAddress: normalized.ownerAddress ?? FALLBACK_STARTUP.ownerAddress,
            name: normalized.name ?? FALLBACK_STARTUP.name,
            description: normalized.description ?? FALLBACK_STARTUP.description,
            githubRepo: normalized.github ?? FALLBACK_STARTUP.githubRepo,
            website: normalized.website ?? FALLBACK_STARTUP.website,
            twitter: normalized.twitter ?? FALLBACK_STARTUP.twitter,
            tokenName: normalized.tokenName ?? FALLBACK_STARTUP.tokenName,
            tokenSymbol: normalized.tokenSymbol ?? FALLBACK_STARTUP.tokenSymbol,
            totalSupply: normalized.totalSupply ?? FALLBACK_STARTUP.totalSupply,
            price: derivedPrice,
            marketCap: derivedMarketCap,
            holders: normalized.holders ?? FALLBACK_STARTUP.holders,
            rank: normalized.rank ?? FALLBACK_STARTUP.rank,
            score: normalized.score ?? FALLBACK_STARTUP.score,
            verified: normalized.verified ?? FALLBACK_STARTUP.verified,
            })

            const profileId = normalized.id
            const [snapshot, posts] = await Promise.all([
            getLatestMetricSnapshot(profileId),
            fetchStartupPosts(profileId, 3),
            ])
            if (!isMounted) return

            if (snapshot) {
            const s = convertTimestamps<MetricSnapshot>(snapshot)
            setMetrics({
                github: {
                commits: s.github.commits,
                stars: s.github.stars,
                forks: s.github.forks,
                lastCommit: formatDateTime(s.updatedAt ?? s.createdAt),
                },
                social: {
                twitterFollowers: s.twitter?.followers ?? FALLBACK_METRICS.social.twitterFollowers,
                linkedinFollowers: FALLBACK_METRICS.social.linkedinFollowers,
                },
                platform: {
                posts: s.traction?.users ?? FALLBACK_METRICS.platform.posts,
                demoViews: FALLBACK_METRICS.platform.demoViews,
                },
            })
            } else {
            setMetrics(FALLBACK_METRICS)
            }

            setStartupPosts(posts.length ? posts.map(p => convertTimestamps<StartupSocialPost>(p)) : [])

            const prefsOwner = walletAddress ?? normalized.ownerAddress ?? null
            if (prefsOwner) {
            const prefs = await getNotificationPreferences(prefsOwner)
            if (!isMounted) return
            if (prefs) {
                const np = convertTimestamps<NotificationPreference>(prefs)
                setNotificationPrefs({
                allowEmail: np.allowEmail,
                allowPush: np.allowPush,
                email: np.email ?? defaultNotificationPrefs.email,
                })
            } else {
                setNotificationPrefs({ ...defaultNotificationPrefs })
            }
            } else {
            setNotificationPrefs({ ...defaultNotificationPrefs })
            }

            setNotificationPrefsLoaded(true)
        } catch (err) {
            console.error('Failed to load dashboard data', err)
            if (isMounted) setError(err instanceof Error ? err.message : 'Unable to load dashboard data')
        } finally {
            if (isMounted) setIsLoading(false)
        }
        }

        loadDashboardData()
        return () => { isMounted = false }
    }, [walletAddress, startupIdParam])

    const notificationUserId = useMemo(
        () => walletAddress ?? startupData.ownerAddress ?? 'guest-user',
        [walletAddress, startupData.ownerAddress],
    )

    const handleNotificationToggle = (key: 'allowEmail' | 'allowPush', value: boolean) => {
        setNotificationPrefs(prev => ({ ...prev, [key]: value }))
    }

    const handleSaveNotificationPrefs = async () => {
        setSavingNotifications(true)
        try {
        await saveNotificationPreferences(notificationUserId, {
            ...notificationPrefs,
            email: notificationPrefs.email ?? '',
        })
        } catch (err) {
        console.error('Failed to save notification preferences', err)
        setError(err instanceof Error ? err.message : 'Unable to save notification preferences')
        } finally {
        setSavingNotifications(false)
        }
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'metrics', label: 'Metrics', icon: TrendingUp },
        { id: 'competitions', label: 'Competitions', icon: Trophy },
        { id: 'token', label: 'Token', icon: Coins },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const

    if (!walletAddress) {
        return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-100">
            <div className="text-center space-y-4">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="text-gray-600">Cüzdanınızı bağlayın ve dashboard’a erişin.</p>
            </div>
        </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100">
        <MainHeader
            highlightPath="/dashboard"
            rightSlot={
            <>
                <HeaderWalletControls />
                <button
                onClick={() => (window.location.href = '/')}
                className="font-medium text-gray-600 transition-colors hover:text-orange-600"
                >
                Back to Home
                </button>
            </>
            }
        />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
            </div>
            )}

            <div className="relative mb-8 rounded-3xl border border-gray-200 bg-white/80 p-8 backdrop-blur-sm">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
                </div>
            )}
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-red-500">
                    <Rocket className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                    <h1 className="text-3xl font-bold text-gray-900">{startupData.name}</h1>
                    {startupData.verified && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                        <Award className="h-4 w-4 text-white" />
                        </div>
                    )}
                    </div>
                    <p className="max-w-2xl text-gray-600">{startupData.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                    <a href={startupData.githubRepo} target="_blank" rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-gray-500 transition-colors hover:text-orange-600">
                        <Github className="h-4 w-4" /><span>GitHub</span>
                    </a>
                    <a href={startupData.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-gray-500 transition-colors hover:text-orange-600">
                        <Globe className="h-4 w-4" /><span>Website</span>
                    </a>
                    <a href={`https://twitter.com/${startupData.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-gray-500 transition-colors hover:text-orange-600">
                        <Twitter className="h-4 w-4" /><span>{startupData.twitter}</span>
                    </a>
                    </div>
                </div>
                </div>
                <div className="space-y-2 text-right">
                <div className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-2xl font-bold text-transparent">
                    #{startupData.rank}
                </div>
                <div className="text-sm text-gray-500">Global Rank</div>
                <div className="text-lg font-semibold text-gray-900">
                    {startupData.score.toLocaleString()} pts
                </div>
                </div>
            </div>
            </div>

            {/* Tabs */}
            <div className="mb-8 flex space-x-1 rounded-2xl border border-gray-200 bg-white/50 p-2 backdrop-blur-sm">
            {tabs.map((tab) => {
                const IconComponent = tab.icon
                const isSelected = selectedTab === tab.id
                return (
                <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`flex items-center space-x-2 rounded-xl px-4 py-3 font-medium transition-all ${
                    isSelected
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-white/50 hover:text-orange-600'
                    }`}
                >
                    <IconComponent className="h-5 w-5" />
                    <span>{tab.label}</span>
                </button>
                )
            })}
            </div>

            {/* Overview */}
            {selectedTab === 'overview' && (
            <div className="space-y-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Token Price" value={`$${startupData.price.toFixed(3)}`} subtitle="24h: +12.5%" icon={Coins} color="text-green-600" trend="+12.5%" />
                <StatCard title="Market Cap" value={`$${(startupData.marketCap / 1000).toFixed(1)}K`} subtitle={`${startupData.holders} holders`} icon={TrendingUp} color="text-blue-600" trend="+8.3%" />
                <StatCard title="GitHub Stars" value={metrics.github.stars} subtitle={`${metrics.github.commits} commits`} icon={Star} color="text-yellow-600" trend={`Last update: ${metrics.github.lastCommit}`} />
                <StatCard title="Platform Score" value={startupData.score.toLocaleString()} subtitle="This month" icon={Activity} color="text-purple-600" trend="+125 points" />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 backdrop-blur-sm">
                    <h3 className="mb-6 text-2xl font-bold text-gray-900">Recent Activity</h3>
                    <div className="space-y-4">
                    {[
                        { message: 'Added new authentication system', time: '2 hours ago', icon: GitCommit },
                        { message: 'Gained 25 new Twitter followers', time: '4 hours ago', icon: Users },
                        { message: 'Demo video reached 100 views', time: '1 day ago', icon: Play },
                        { message: '50 new token holders joined', time: '2 days ago', icon: Coins },
                    ].map((a, i) => {
                        const I = a.icon
                        return (
                        <div key={i} className="flex items-center space-x-4 rounded-xl bg-gray-50/50 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-red-400">
                            <I className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                            <p className="font-medium text-gray-900">{a.message}</p>
                            <p className="text-sm text-gray-500">{a.time}</p>
                            </div>
                        </div>
                        )
                    })}
                    </div>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 backdrop-blur-sm">
                    <h3 className="mb-6 text-2xl font-bold text-gray-900">Community Updates</h3>
                    <div className="space-y-4">
                    {startupPosts.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                        No off-chain posts synced yet. Posts from Firebase will appear here.
                        </div>
                    )}
                    {startupPosts.map((post) => (
                        <div key={post.id} className="rounded-2xl border border-gray-200 bg-white/70 p-5">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="font-semibold text-gray-900">{post.authorName ?? 'Community Member'}</div>
                            <span className="text-xs text-gray-500">{formatDateTime(post.createdAt)}</span>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-700">{post.content}</p>
                        {!!post.metrics && (
                            <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                            <span>❤ {post.metrics.likes}</span>
                            <span>💬 {post.metrics.comments}</span>
                            <span>🔁 {post.metrics.shares}</span>
                            </div>
                        )}
                        </div>
                    ))}
                    </div>
                </div>
                </div>
            </div>
            )}

            {/* Competitions */}
            {selectedTab === 'competitions' && (
            <div className="space-y-6">
                {competitions.map((c) => (
                <div key={c.id} className="rounded-3xl border border-gray-200 bg-white/80 p-8 backdrop-blur-sm">
                    <div className="flex items-start justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">{c.name}</h3>
                            <p className="text-gray-600">{c.description}</p>
                        </div>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span className="flex items-center space-x-1"><Users className="h-4 w-4" /><span>{c.participants} participants</span></span>
                        <span className="flex items-center space-x-1"><Coins className="h-4 w-4" /><span>{c.prizePool} prize pool</span></span>
                        {c.status === 'active' && c.myRank && (
                            <span className="flex items-center space-x-1 font-medium text-orange-600">
                            <Award className="h-4 w-4" /><span>Rank #{c.myRank}</span>
                            </span>
                        )}
                        </div>
                    </div>
                    <div className="space-y-2 text-right">
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {c.status === 'active' ? 'Active' : 'Upcoming'}
                        </span>
                        {c.status === 'active'
                        ? <p className="text-sm text-gray-500">Ends: {c.endDate}</p>
                        : <p className="text-sm text-gray-500">Starts: {c.startDate}</p>}
                        <button
                        className={`rounded-xl px-6 py-2 font-medium transition-all ${
                            c.joined
                            ? 'cursor-default bg-gray-200 text-gray-600'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                        }`}
                        disabled={c.joined}
                        >
                        {c.joined ? 'Joined' : 'Join Competition'}
                        </button>
                    </div>
                    </div>
                </div>
                ))}
            </div>
            )}

            {/* Metrics */}
            {selectedTab === 'metrics' && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 backdrop-blur-sm">
                <h3 className="mb-6 text-2xl font-bold text-gray-900">GitHub Activity</h3>
                <div className="space-y-4">
                    <Row label="Total Commits" value={metrics.github.commits} icon={GitCommit} valueClass="text-gray-900" />
                    <Row label="Stars" value={metrics.github.stars} icon={Star} valueClass="text-yellow-600" />
                    <Row label="Forks" value={metrics.github.forks} icon={GitFork} valueClass="text-blue-600" />
                </div>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 backdrop-blur-sm">
                <h3 className="mb-6 text-2xl font-bold text-gray-900">Social Media</h3>
                <div className="space-y-4">
                    <Row label="Twitter Followers" value={metrics.social.twitterFollowers} icon={Twitter} valueClass="text-blue-600" />
                    <Row label="LinkedIn Followers" value={metrics.social.linkedinFollowers} icon={Users} valueClass="text-blue-700" />
                    <Row label="Demo Views" value={metrics.platform.demoViews} icon={Eye} valueClass="text-purple-600" />
                </div>
                </div>
            </div>
            )}

            {/* Settings */}
            {selectedTab === 'settings' && (
            <div className="space-y-6">
                <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 backdrop-blur-sm">
                <h3 className="mb-4 text-2xl font-bold text-gray-900">Notification Preferences</h3>
                <p className="mb-6 text-sm text-gray-500">
                    Manage Firebase-backed email and push notifications for your startup updates.
                </p>

                {!notificationPrefsLoaded && (
                    <div className="mb-4 flex items-center space-x-2 text-sm text-gray-500">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-orange-400" />
                    <span>Loading preferences…</span>
                    </div>
                )}

                <div className="space-y-4">
                    <ToggleRow
                    label="Email notifications"
                    checked={notificationPrefs.allowEmail}
                    onChange={(v) => handleNotificationToggle('allowEmail', v)}
                    />
                    <ToggleRow
                    label="Push notifications"
                    checked={notificationPrefs.allowPush}
                    onChange={(v) => handleNotificationToggle('allowPush', v)}
                    />

                    <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Notification email</label>
                    <input
                        type="email"
                        value={notificationPrefs.email ?? ''}
                        onChange={(e) =>
                        setNotificationPrefs((p) => ({ ...p, email: e.target.value }))
                        }
                        placeholder="founder@startup.com"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-orange-500 focus:outline-none"
                    />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                    Preferences are synced to Firestore under `{notificationUserId}`.
                    </div>
                    <button
                    onClick={handleSaveNotificationPrefs}
                    className={`rounded-xl px-6 py-3 font-medium text-white transition-all ${
                        savingNotifications
                        ? 'cursor-wait bg-gray-400'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                    }`}
                    disabled={savingNotifications}
                    >
                    {savingNotifications ? 'Saving…' : 'Save Preferences'}
                    </button>
                </div>
                </div>
            </div>
            )}
        </div>
        </div>
    )
    }

    /* ---------- küçük alt bileşenler ---------- */

    type StatCardProps = {
    title: string
    value: string | number
    subtitle?: string
    icon: ComponentType<{ className?: string }>
    color: string
    trend?: string
    }

    const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) => (
    <div className="rounded-2xl border border-gray-200 bg-white/80 p-6 transition-all hover:shadow-lg backdrop-blur-sm">
        <div className="flex items-start justify-between">
        <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-400 to-red-400">
            <Icon className="h-6 w-6 text-white" />
        </div>
        </div>
        {trend && <div className="mt-4 text-sm font-medium text-green-600">{trend}</div>}
    </div>
    )

    function Row({
    label,
    value,
    icon: Icon,
    valueClass,
    }: {
    label: string
    value: string | number
    icon: ComponentType<{ className?: string }>
    valueClass?: string
    }) {
    return (
        <div className="flex items-center justify-between">
        <span className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-gray-500" />
            <span>{label}</span>
        </span>
        <span className={`text-2xl font-bold ${valueClass ?? 'text-gray-900'}`}>{value}</span>
        </div>
    )
    }

    function ToggleRow({
    label,
    checked,
    onChange,
    }: {
    label: string
    checked: boolean
    onChange: (v: boolean) => void
    }) {
    return (
        <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <span className="font-medium text-gray-700">{label}</span>
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-5 w-5 rounded text-orange-500"
        />
        </label>
    )
    }