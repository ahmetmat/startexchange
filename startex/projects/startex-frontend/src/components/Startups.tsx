import React, { useEffect, useMemo, useState } from 'react'
import {
  Rocket,
  Wallet,
  Coins,
  LineChart,
  Users,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  ShoppingCart,
  ExternalLink,
  DollarSign,
  Sparkles,
} from 'lucide-react'

import { useWallet } from '../hooks/useAlgorand'
import {
  LAUNCHED_STARTUP_STORAGE_KEY,
  LAUNCHED_STARTUP_UPDATE_EVENT,
  loadLaunchedStartups,
  type LaunchedStartupRecord,
} from '../lib/startupStorage'

const FALLBACK_STARTUPS: LaunchedStartupRecord[] = [
  {
    startupId: 5001,
    assetId: 9001001,
    name: 'TechFlow AI',
    description: 'Next-generation AI tooling that ships production-ready models in minutes.',
    category: 'AI/ML',
    website: 'https://techflow.ai',
    github: 'https://github.com/techflow/ai',
    twitter: '@techflowai',
    tokenName: 'TechFlow Token',
    tokenSymbol: 'TECH',
    totalSupply: 1_000_000,
    decimals: 6,
    launchPrice: 0.75,
    founderAddress: 'ALGO6VJY...TECH',
    registerTxId: 'MOCK-REGISTER-TXID-TECH',
    tokenizeTxId: 'MOCK-TOKENIZE-TXID-TECH',
    createdAt: new Date().toISOString(),
  },
  {
    startupId: 5002,
    assetId: 9001002,
    name: 'GreenChain',
    description: 'Tokenized carbon offsets and smart sustainability analytics for global teams.',
    category: 'Climate',
    website: 'https://greenchain.earth',
    github: 'https://github.com/greenchain/earth',
    twitter: '@greenchain',
    tokenName: 'GreenChain Token',
    tokenSymbol: 'GREEN',
    totalSupply: 2_000_000,
    decimals: 6,
    launchPrice: 0.42,
    founderAddress: 'ALGO9KHG...ECO',
    registerTxId: 'MOCK-REGISTER-TXID-GREEN',
    tokenizeTxId: 'MOCK-TOKENIZE-TXID-GREEN',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

type TradeSide = 'buy' | 'sell'

type TradeRecord = {
  id: number
  startupId: number
  side: TradeSide
  amount: number
  price: number
  createdAt: string
}

function formatNumber(value: number, fractionDigits = 2) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date))
  } catch (error) {
    return date
  }
}

export default function Startups() {
  const [startups, setStartups] = useState<LaunchedStartupRecord[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [orderType, setOrderType] = useState<TradeSide>('buy')
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [history, setHistory] = useState<TradeRecord[]>([])
  const { isConnected, connect, disconnect, address, isConnecting } = useWallet()

  useEffect(() => {
    const hydrate = () => {
      const stored = loadLaunchedStartups()
      const merged = stored.length ? stored : FALLBACK_STARTUPS
      setStartups(merged)
      if (merged.length && !selectedId) {
        setSelectedId(merged[0].startupId)
        setPrice(merged[0].launchPrice.toString())
      }
    }

    hydrate()

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== LAUNCHED_STARTUP_STORAGE_KEY) return
      hydrate()
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(LAUNCHED_STARTUP_UPDATE_EVENT, hydrate)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(LAUNCHED_STARTUP_UPDATE_EVENT, hydrate)
    }
  }, [selectedId])

  const selectedStartup = useMemo(
    () => startups.find((entry) => entry.startupId === selectedId) ?? null,
    [startups, selectedId],
  )

  useEffect(() => {
    if (selectedStartup) {
      setPrice(selectedStartup.launchPrice.toString())
    }
  }, [selectedStartup?.startupId])

  const marketStats = useMemo(() => {
    if (!selectedStartup) return null
    const supply = selectedStartup.totalSupply / 10 ** selectedStartup.decimals
    const marketCap = supply * selectedStartup.launchPrice
    return {
      supply,
      marketCap,
    }
  }, [selectedStartup])

  const handleSync = () => {
    setIsSyncing(true)
    setTimeout(() => setIsSyncing(false), 600)
  }

  const handleTrade = () => {
    if (!selectedStartup) return
    if (!isConnected) {
      alert('Lütfen önce Pera cüzdanınızı bağlayın.')
      return
    }
    const numericAmount = Number(amount)
    const numericPrice = Number(price)
    if (!numericAmount || numericAmount <= 0 || !numericPrice || numericPrice <= 0) {
      alert('Geçerli bir miktar ve fiyat girin.')
      return
    }
    const record: TradeRecord = {
      id: Date.now(),
      startupId: selectedStartup.startupId,
      side: orderType,
      amount: numericAmount,
      price: numericPrice,
      createdAt: new Date().toISOString(),
    }
    setHistory((prev) => [record, ...prev].slice(0, 10))
    setAmount('')
  }

  const connectWallet = async () => {
    if (isConnected) {
      await disconnect()
    } else {
      await connect('pera')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50">
      <div className="bg-white/80 backdrop-blur border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-100/70 px-4 py-2 text-sm font-semibold text-rose-600">
                <Sparkles className="h-4 w-4" />
                Topluluk Lansmanları
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-rose-950">Startuplar</h1>
                <p className="mt-2 max-w-2xl text-base md:text-lg text-rose-600">
                  Yeni tokenize edilen girişimleri keşfedin, anında inceleyin ve toplum destekli likidite ile tokenlarını alıp satın.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-600 shadow-sm">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5" />
                <div className="font-semibold">
                  {isConnected ? 'Cüzdan bağlı' : 'Cüzdan bağlı değil'}
                </div>
              </div>
              <p className="mt-2 text-xs text-rose-500">
                {isConnected && address
                  ? `${address.slice(0, 6)}...${address.slice(-6)}`
                  : 'Token alım satımı için Pera Wallet bağlayın.'}
              </p>
              <button
                className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold text-white transition ${
                  isConnected ? 'bg-rose-500 hover:bg-rose-600' : 'bg-rose-600 hover:bg-rose-700'
                } ${isConnecting ? 'opacity-80' : ''}`}
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isConnected ? 'Bağlantıyı Kes' : 'Pera Wallet Bağla'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-[360px,1fr]">
          <aside className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-rose-500">Tokenize Startuplar</h2>
              <button
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600"
                onClick={handleSync}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                Yenile
              </button>
            </div>

            <div className="space-y-3">
              {startups.map((startup) => {
                const isActive = startup.startupId === selectedId
                return (
                  <button
                    key={startup.startupId}
                    onClick={() => setSelectedId(startup.startupId)}
                    className={`w-full rounded-2xl border p-5 text-left transition ${
                      isActive
                        ? 'border-rose-400 bg-white shadow-lg shadow-rose-100'
                        : 'border-rose-100 bg-white/80 hover:border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-600">
                          <Rocket className="h-3.5 w-3.5" />
                          #{startup.startupId}
                        </div>
                        <h3 className="mt-3 text-lg font-bold text-rose-950">{startup.name}</h3>
                        <p className="mt-1 text-sm text-rose-600 line-clamp-2">{startup.description}</p>
                      </div>
                      <span className="rounded-full bg-rose-600/10 px-3 py-1 text-xs font-semibold text-rose-600">
                        {startup.tokenSymbol}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-rose-500">
                      {startup.category && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5">
                          <Sparkles className="h-3 w-3" />
                          {startup.category}
                        </span>
                      )}
                      <span>ASA #{startup.assetId}</span>
                      <span>Fiyat {formatNumber(startup.launchPrice)} ALGO</span>
                    </div>
                  </button>
                )
              })}

              {!startups.length && (
                <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-white/80 p-8 text-center text-sm text-rose-500">
                  Henüz kayıtlı startup yok. Launch konsolundan ilk tokenınızı oluşturun.
                </div>
              )}
            </div>
          </aside>

          <section className="space-y-6">
            {selectedStartup ? (
              <div className="space-y-6">
                <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-lg">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
                        <Rocket className="h-4 w-4" />
                        {selectedStartup.tokenSymbol} Token
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-rose-950">{selectedStartup.name}</h2>
                        <p className="mt-2 max-w-2xl text-sm text-rose-600">{selectedStartup.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-rose-500">
                        {selectedStartup.website && (
                          <a
                            className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 hover:bg-rose-200"
                            href={selectedStartup.website}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Website
                          </a>
                        )}
                        {selectedStartup.github && (
                          <a
                            className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 hover:bg-rose-200"
                            href={selectedStartup.github}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            GitHub
                          </a>
                        )}
                        {selectedStartup.twitter && (
                          <a
                            className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 hover:bg-rose-200"
                            href={`https://twitter.com/${selectedStartup.twitter.replace('@', '')}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            X / Twitter
                          </a>
                        )}
                      </div>
                    </div>

                    {marketStats && (
                      <div className="grid gap-4 rounded-2xl border border-rose-100 bg-rose-50/60 p-5 text-sm text-rose-600">
                        <div className="flex items-center justify-between gap-8">
                          <span className="inline-flex items-center gap-2 font-semibold text-rose-500">
                            <Coins className="h-4 w-4" />
                            Toplam Arz
                          </span>
                          <span className="font-mono text-base text-rose-800">
                            {formatNumber(marketStats.supply, 0)} {selectedStartup.tokenSymbol}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                          <span className="inline-flex items-center gap-2 font-semibold text-rose-500">
                            <DollarSign className="h-4 w-4" />
                            Başlangıç Fiyatı
                          </span>
                          <span className="font-mono text-base text-rose-800">
                            {formatNumber(selectedStartup.launchPrice)} ALGO
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                          <span className="inline-flex items-center gap-2 font-semibold text-rose-500">
                            <LineChart className="h-4 w-4" />
                            Teorik Piyasa Değeri
                          </span>
                          <span className="font-mono text-base text-rose-800">
                            {formatNumber(marketStats.marketCap)} ALGO
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                          <span className="inline-flex items-center gap-2 font-semibold text-rose-500">
                            <Users className="h-4 w-4" />
                            Kurucu
                          </span>
                          <span className="font-mono text-xs text-rose-700">
                            {selectedStartup.founderAddress.slice(0, 6)}...{selectedStartup.founderAddress.slice(-6)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 grid gap-4 text-xs text-rose-400">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-3.5 w-3.5" />
                      Registry TX: <span className="font-mono text-rose-600">{selectedStartup.registerTxId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-3.5 w-3.5" />
                      Tokenize TX: <span className="font-mono text-rose-600">{selectedStartup.tokenizeTxId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-3.5 w-3.5" />
                      Yayın Tarihi: <span className="font-semibold text-rose-600">{formatDate(selectedStartup.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
                  <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-rose-900">Al / Sat</h3>
                      <div className="inline-flex rounded-full border border-rose-200 bg-rose-100/60 p-1">
                        <button
                          onClick={() => setOrderType('buy')}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            orderType === 'buy'
                              ? 'bg-rose-600 text-white shadow'
                              : 'text-rose-500'
                          }`}
                        >
                          Satın Al
                        </button>
                        <button
                          onClick={() => setOrderType('sell')}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            orderType === 'sell'
                              ? 'bg-rose-600 text-white shadow'
                              : 'text-rose-500'
                          }`}
                        >
                          Sat
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-rose-500">
                      İşlemler şu an simüle edilmektedir; gerçek DEX bağlantısı gelecek sürümde etkinleşecek.
                    </p>

                    <div className="mt-6 space-y-5">
                      <div>
                        <label className="text-xs font-semibold text-rose-500">Miktar ({selectedStartup.tokenSymbol})</label>
                        <input
                          value={amount}
                          onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="250"
                          inputMode="decimal"
                          className="mt-2 w-full rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-sm text-rose-700 placeholder:text-rose-300 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-rose-500">Fiyat (ALGO)</label>
                        <input
                          value={price}
                          onChange={(event) => setPrice(event.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                          placeholder="1.00"
                          inputMode="decimal"
                          className="mt-2 w-full rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-sm text-rose-700 placeholder:text-rose-300 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                      </div>
                      <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 text-sm text-rose-600">
                        <div className="flex items-center justify-between">
                          <span>Toplam</span>
                          <span className="font-semibold text-rose-700">
                            {amount && price ? formatNumber(Number(amount) * Number(price)) : '0.00'} ALGO
                          </span>
                        </div>
                      </div>
                      {!isConnected && (
                        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-100/80 p-4 text-xs text-rose-600">
                          <AlertCircle className="h-4 w-4" />
                          İşlem yapmadan önce cüzdanınızı bağlayın.
                        </div>
                      )}
                      <button
                        onClick={handleTrade}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                          orderType === 'buy'
                            ? 'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400'
                            : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600'
                        }`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {orderType === 'buy' ? 'Satın Al' : 'Sat'}
                      </button>
                      <a
                        href={`/trading?assetId=${selectedStartup.assetId}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:border-rose-400 hover:text-rose-700"
                      >
                        Gelişmiş İşlem Platformu
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-rose-900">Son İşlemler</h3>
                      <span className="text-xs text-rose-400">En güncel 10 kayıt</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {history.length === 0 && (
                        <p className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 text-xs text-rose-500">
                          Henüz işlem yok. Alım ya da satım yaparak listeyi güncelleyebilirsiniz.
                        </p>
                      )}
                      {history.map((trade) => (
                        <div
                          key={trade.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-sm text-rose-600"
                        >
                          <span className={`font-semibold ${trade.side === 'buy' ? 'text-rose-600' : 'text-slate-600'}`}>
                            {trade.side === 'buy' ? 'Alındı' : 'Satıldı'}
                          </span>
                          <span className="font-mono">
                            {formatNumber(trade.amount)} {selectedStartup.tokenSymbol}
                          </span>
                          <span className="font-mono">{formatNumber(trade.price)} ALGO</span>
                          <span className="text-xs text-rose-400">{formatDate(trade.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-rose-200 bg-white/70 p-16 text-center text-rose-500">
                <Rocket className="mx-auto h-12 w-12 text-rose-300" />
                <h3 className="mt-4 text-2xl font-bold text-rose-400">Bir startup seçin</h3>
                <p className="mt-2 text-sm">Sol menüden bir proje seçerek detaylarını görüntüleyin.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
