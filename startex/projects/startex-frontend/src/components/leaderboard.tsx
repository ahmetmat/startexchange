import React, { useEffect, useMemo, useState } from 'react'
import { DonationModal } from '@/components/DonationModal'
import type { LeaderboardEntry, StartupProfile } from '@/lib/firebase/types'
import { convertTimestamps, getLeaderboard, listStartupProfiles } from '@/lib/firebase/firestore'
import { getAlgod } from '@/services/algorand/algod'
import { signAndSendPayment } from '@/services/algorand/donate'
import { getPrimaryAccount } from '@/services/algorand/pera'

type LeaderboardPeriod = 'overall' | 'monthly' | 'weekly'

type StartupWithMetrics = {
  profile: StartupProfile
  metrics: LeaderboardEntry
}

const MIN_DONATION_ALGO = 0.1

const FALLBACK_LEADERBOARD: LeaderboardEntry[] = [
  { id:'techflow-ai', startupId:'techflow-ai', rank:1, previousRank:2, name:'TechFlow AI', category:'AI/ML', score:4850, change:'+125', tokenSymbol:'TECH', tokenPrice:0.045, priceChange:'+15.2%', marketCap:45000, holders:234, verified:true, website:'https://techflow.ai', github:'https://github.com/techflow/ai', twitter:'@techflowai' },
  { id:'greenchain-solutions', startupId:'greenchain-solutions', rank:2, previousRank:1, name:'GreenChain Solutions', category:'Sustainability', score:4720, change:'-45', tokenSymbol:'GREEN', tokenPrice:0.032, priceChange:'+8.7%', marketCap:32000, holders:198, verified:true, website:'https://greenchain.eco' },
  { id:'healthsync-pro', startupId:'healthsync-pro', rank:3, previousRank:4, name:'HealthSync Pro', category:'HealthTech', score:4590, change:'+89', tokenSymbol:'HEALTH', tokenPrice:0.028, priceChange:'+12.4%', marketCap:28000, holders:167, verified:true, website:'https://healthsync.pro' },
]

const FALLBACK_STARTUPS: StartupProfile[] = FALLBACK_LEADERBOARD.map((e, i) => ({
  id: e.startupId ?? e.id ?? `fallback-${i+1}`,
  ownerAddress: 'SOME-ALGORAND-ADDRESS-HERE', // buraya backend gelince gerçek adres yazılacak
  name: e.name,
  description: e.description ?? 'High-performing startup on StartEx.',
  website: e.website,
  twitter: e.twitter,
  github: e.github,
  tokenSymbol: e.tokenSymbol,
  tokenName: e.tokenSymbol ?? e.name,
  score: e.score,
  rank: e.rank,
  verified: e.verified ?? false,
  tags: e.category ? [e.category] : undefined,
  createdAt: new Date(Date.now() - (i+1)*86400000).toISOString(),
  updatedAt: new Date(Date.now() - i*86400000).toISOString(),
}))

const PERIOD_OPTIONS: { label: string; value: LeaderboardPeriod }[] = [
  { label: 'Overall', value: 'overall' },
  { label: 'This Month', value: 'monthly' },
  { label: 'This Week', value: 'weekly' },
]

export default function Leaderboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('overall')
  const [searchQuery, setSearchQuery] = useState('')
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [startupProfiles, setStartupProfiles] = useState<StartupProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeDonation, setActiveDonation] = useState<{ metrics: LeaderboardEntry; profile?: StartupProfile } | null>(null)
  const [account, setAccount] = useState<string | null>(null)

  useEffect(() => {
    getPrimaryAccount().then(setAccount).catch(() => setAccount(null))
  }, [])

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setIsLoading(true); setError(null)
      try {
        const [lb, sp] = await Promise.all([
          getLeaderboard(selectedPeriod),
          listStartupProfiles(100),
        ])
        if (!isMounted) return
        setLeaderboardData(lb.map(convertTimestamps))
        setStartupProfiles(sp.map(convertTimestamps))
      } catch (e: any) {
        if (!isMounted) return
        setLeaderboardData([])
        setStartupProfiles([])
        setError(e?.message ?? 'Load failed')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [selectedPeriod])

  const leaderboardEntries = useMemo(
    () => (leaderboardData.length ? leaderboardData : FALLBACK_LEADERBOARD),
    [leaderboardData]
  )

  const startupsWithMetrics = useMemo<StartupWithMetrics[]>(() => {
    const profiles = startupProfiles.length ? startupProfiles : FALLBACK_STARTUPS
    const map = new Map<string, LeaderboardEntry>()
    leaderboardEntries.forEach(e => {
      const k = e.startupId ?? e.id
      if (k) map.set(k, e)
    })
    return profiles.map((p, i) => {
      const m = p.id ? map.get(p.id) : undefined
      const merged: LeaderboardEntry = {
        id: m?.id ?? `startup-${p.id ?? i}`,
        startupId: p.id ?? m?.startupId,
        name: m?.name ?? p.name ?? 'Unnamed',
        founder: m?.founder ?? p.ownerAddress,
        description: m?.description ?? p.description,
        category: m?.category ?? (p.tags?.[0] ?? 'General'),
        score: m?.score ?? p.score ?? 0,
        rank: m?.rank ?? p.rank ?? i + 1,
        previousRank: m?.previousRank,
        change: m?.change ?? '+0',
        tokenSymbol: m?.tokenSymbol ?? p.tokenSymbol ?? p.tokenName,
        tokenPrice: m?.tokenPrice,
        priceChange: m?.priceChange ?? '+0%',
        marketCap: m?.marketCap,
        holders: m?.holders,
        verified: m?.verified ?? p.verified ?? false,
        website: m?.website ?? p.website,
        github: m?.github ?? p.github,
        twitter: m?.twitter ?? p.twitter,
        createdAt: m?.createdAt ?? p.createdAt,
        updatedAt: m?.updatedAt ?? p.updatedAt,
      }
      return { profile: p, metrics: merged }
    })
  }, [startupProfiles, leaderboardEntries])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return startupsWithMetrics.filter(({ metrics, profile }) => {
      const cat = metrics.category ?? 'General'
      return (
        q.length === 0 ||
        metrics.name?.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        (profile.tags ?? []).some(t => t.toLowerCase().includes(q))
      )
    })
  }, [startupsWithMetrics, searchQuery])

  const openDonation = (m: LeaderboardEntry) => {
    const prof = m.startupId ? startupProfiles.find(p => p.id === m.startupId) : undefined
    setActiveDonation({ metrics: m, profile: prof })
  }

  const handleConfirm = async (amount: number) => {
    if (!activeDonation) return
    if (!account) { alert('Önce cüzdan bağla (Pera).'); return }
    if (amount < MIN_DONATION_ALGO) { alert(`Minimum bağış ${MIN_DONATION_ALGO} ALGO`); return }

    const recipient = activeDonation.profile?.ownerAddress ?? activeDonation.metrics.founder ?? ''
    if (!recipient) { alert('Alıcı adresi yok.'); return }

    try {
      const algod = getAlgod()
      const txId = await signAndSendPayment(algod, account, recipient, amount)
      alert(`Bağış gönderildi. txId=${txId}`)
      setActiveDonation(null)
    } catch (e: any) {
      alert(e?.message ?? 'Bağış başarısız.')
    }
  }

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <input
          placeholder="Search startups…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex:1, padding:10 }}
        />
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as LeaderboardPeriod)}
        >
          {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {isLoading && <div>Loading…</div>}
      {error && <div style={{ color:'crimson' }}>{error}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:16 }}>
        {filtered.map(({ profile, metrics }) => (
          <div key={`${metrics.id}-${profile.id}`} style={{
            background:'#fff', border:'1px solid #eee', borderRadius:16, padding:16
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontWeight:800 }}>{metrics.name}</div>
              {metrics.verified && <span style={{ fontSize:12, color:'#2563eb' }}>Verified</span>}
            </div>
            {metrics.description && <p style={{ marginTop:0, color:'#555' }}>{metrics.description}</p>}
            <div style={{ display:'flex', gap:12, fontSize:12, color:'#666', marginTop:8 }}>
              <span>Score: <b>{metrics.score ?? 0}</b></span>
              <span>Rank: <b>{metrics.rank ?? '-'}</b></span>
              <span>Holders: <b>{metrics.holders ?? 0}</b></span>
            </div>
            {profile.ownerAddress && (
              <div style={{ marginTop:6, fontFamily:'monospace', fontSize:12, color:'#444' }}>
                Owner: {profile.ownerAddress.slice(0,6)}…{profile.ownerAddress.slice(-6)}
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
              <button onClick={() => openDonation(metrics)}>Bağış Yap</button>
            </div>
          </div>
        ))}
      </div>

      <DonationModal
        isOpen={!!activeDonation}
        onClose={() => setActiveDonation(null)}
        minAmount={MIN_DONATION_ALGO}
        title={activeDonation ? `${activeDonation.metrics.name} için bağış yap` : 'Bağış Yap'}
        description={activeDonation ? `Bağış, cüzdanınızdan doğrudan girişim sahibine gönderilecek.` : undefined}
        onConfirm={handleConfirm}
      />
    </div>
  )
}