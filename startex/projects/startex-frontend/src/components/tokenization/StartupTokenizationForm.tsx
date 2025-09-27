import { useWallet } from '@txnlab/use-wallet-react'
import { useEffect, useMemo, useState } from 'react'
import { useSnackbar } from 'notistack'

import { getConfiguredNetwork, getStartupTokenizationAppAddress, getStartupTokenizationAppId } from '../../lib/algorand/client'
import {
  AppSnapshot,
  StartupMetadata,
  StartupRecord,
  TokenSettings,
  configureToken,
  fetchStartup,
  loadAppSnapshot,
  registerStartup,
  updatePrice,
} from '../../lib/algorand/startupTokenization'

const NETWORK_NAME = getConfiguredNetwork()
const STARTUP_APP_ID = getStartupTokenizationAppId()
const STARTUP_APP_ADDRESS = getStartupTokenizationAppAddress()

function parseBigint(value: string, fallback = 0n) {
  const trimmed = value.replace(/[,\s_]/g, '')
  if (!trimmed) return fallback
  try {
    return BigInt(trimmed)
  } catch (error) {
    return fallback
  }
}

function formatAlgoAmount(value: bigint | number) {
  const micro = Number(value)
  return (micro / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function StartupTokenizationForm() {
  const { transactionSigner, activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null)
  const [startupId, setStartupId] = useState<number | null>(null)
  const [startupInfo, setStartupInfo] = useState<StartupRecord | null>(null)

  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [registerForm, setRegisterForm] = useState({
    name: '',
    description: '',
    category: '',
    website: '',
    github: '',
    tokenSymbol: '',
    totalSupply: '1000000',
  })

  const [tokenForm, setTokenForm] = useState({
    assetId: '',
    pricePerToken: '1000',
    tradable: true,
    liquidityDeposit: '5000000',
  })

  const [priceForm, setPriceForm] = useState({ price: '1500' })

  const isReady = useMemo(() => STARTUP_APP_ID > 0 && Boolean(activeAddress && transactionSigner), [activeAddress, transactionSigner])

  useEffect(() => {
    if (!STARTUP_APP_ID) return

    const bootstrap = async () => {
      try {
        setRefreshing(true)
        const snapshot = await loadAppSnapshot()
        setSnapshot(snapshot)
      } catch (error) {
        console.error('Failed to load startup app snapshot', error)
        enqueueSnackbar('Unable to load startup contract state. Check your environment variables.', { variant: 'warning' })
      } finally {
        setRefreshing(false)
      }
    }

    bootstrap()
  }, [enqueueSnackbar])

  const ensureWalletReady = () => {
    if (!transactionSigner || !activeAddress) {
      throw new Error('Connect a wallet before interacting with the contract')
    }
    if (!STARTUP_APP_ID) {
      throw new Error('Set VITE_STARTUP_APP_ID to the deployed application id before using the workflow')
    }
  }

  const handleRegisterStartup = async () => {
    if (!snapshot) {
      enqueueSnackbar('App state not loaded yet', { variant: 'warning' })
      return
    }

    try {
      ensureWalletReady()
      setLoading(true)

     const metadata: StartupMetadata = {
       name: registerForm.name.trim(),
       description: registerForm.description.trim(),
       category: registerForm.category.trim(),
       website: registerForm.website.trim(),
       github: registerForm.github.trim(),
       tokenSymbol: registerForm.tokenSymbol.trim().toUpperCase(),
       totalSupply: parseBigint(registerForm.totalSupply, 0n),
     }

      if (!metadata.name || !metadata.description) {
        throw new Error('Name and description are required')
      }
      if (metadata.totalSupply <= 0n) {
        throw new Error('Total supply must be a positive number')
      }

      const { startupId } = await registerStartup({
        metadata,
        registryFee: snapshot.registryFee,
        expectedStartupId: snapshot.nextId,
        sender: activeAddress!,
        signer: transactionSigner!,
      })

      setStartupId(startupId)
      enqueueSnackbar(`Startup registered with ID ${startupId}`, { variant: 'success' })

      const updatedSnapshot = await loadAppSnapshot()
      setSnapshot(updatedSnapshot)
    } catch (error) {
      console.error('Failed to register startup', error)
      enqueueSnackbar(error instanceof Error ? error.message : 'Startup registration failed', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleConfigureToken = async () => {
    if (startupId === null) {
      enqueueSnackbar('Register the startup first', { variant: 'warning' })
      return
    }
    if (!snapshot) {
      enqueueSnackbar('App state not loaded yet', { variant: 'warning' })
      return
    }

    try {
      ensureWalletReady()
      setLoading(true)

      const settings: TokenSettings = {
        startupId,
        assetId: parseBigint(tokenForm.assetId),
        pricePerToken: parseBigint(tokenForm.pricePerToken),
        tradable: tokenForm.tradable,
        liquidityDeposit: parseBigint(tokenForm.liquidityDeposit),
      }

      if (settings.assetId <= 0n) {
        throw new Error('Provide the ASA id that represents your startup token')
      }
      if (settings.pricePerToken <= 0n) {
        throw new Error('Set a strictly positive token price (microAlgo)')
      }
      if (settings.liquidityDeposit < snapshot.tokenizationFee) {
        throw new Error(`Liquidity deposit must be at least ${snapshot.tokenizationFee.toString()} microAlgo`)
      }

      await configureToken({
        settings,
        tokenizationFee: snapshot.tokenizationFee,
        sender: activeAddress!,
        signer: transactionSigner!,
      })

      enqueueSnackbar('Token configuration recorded on-chain', { variant: 'success' })
      await handleFetchStartup(startupId)
    } catch (error) {
      console.error('Failed to configure token', error)
      enqueueSnackbar(error instanceof Error ? error.message : 'Token configuration failed', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePrice = async () => {
    if (startupId === null) {
      enqueueSnackbar('Register the startup first', { variant: 'warning' })
      return
    }

    try {
      ensureWalletReady()
      setLoading(true)

      await updatePrice({
        startupId,
        newPrice: (() => {
          const price = parseBigint(priceForm.price)
          if (price <= 0n) {
            throw new Error('New price must be positive')
          }
          return price
        })(),
        sender: activeAddress!,
        signer: transactionSigner!,
      })

      enqueueSnackbar('Token price updated', { variant: 'success' })
      await handleFetchStartup(startupId)
    } catch (error) {
      console.error('Failed to update price', error)
      enqueueSnackbar(error instanceof Error ? error.message : 'Price update failed', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleFetchStartup = async (targetId?: number) => {
    const id = targetId ?? startupId
    if (id === null) return

    try {
      ensureWalletReady()
      setRefreshing(true)

      const record = await fetchStartup({
        startupId: id,
        sender: activeAddress!,
        signer: transactionSigner!,
      })

      setStartupInfo(record)
    } catch (error) {
      console.error('Failed to fetch startup info', error)
      enqueueSnackbar(error instanceof Error ? error.message : 'Snapshot failed', { variant: 'error' })
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Tokenize Your Startup</h2>
            <p className="text-sm text-slate-600 mt-1">
              Register founder metadata, connect ASA liquidity, and push price updates through Algokit {NETWORK_NAME} endpoints.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Network</p>
            <p className="text-sm font-medium text-slate-700">{NETWORK_NAME}</p>
          </div>
        </div>
        {STARTUP_APP_ID === 0 && (
          <p className="mt-2 text-sm text-amber-600">
            Configure `VITE_STARTUP_APP_ID` with the deployed application id to activate on-chain interactions.
          </p>
        )}
        {STARTUP_APP_ADDRESS && (
          <p className="text-xs text-slate-500">Contract address: {STARTUP_APP_ADDRESS}</p>
        )}
      </header>

      <section className="grid gap-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-slate-900">Step 1 · Register startup profile</h3>
        <p className="text-xs text-slate-500">
          Registry fee: {formatAlgoAmount(snapshot?.registryFee ?? 0)} ALGO · Next on-chain id: {snapshot ? snapshot.nextId.toString() : '…'}
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="input input-bordered" placeholder="Startup name" value={registerForm.name} onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))} />
          <input className="input input-bordered" placeholder="Category" value={registerForm.category} onChange={(e) => setRegisterForm((prev) => ({ ...prev, category: e.target.value }))} />
        </div>
        <textarea className="textarea textarea-bordered" placeholder="What problem are you solving?" value={registerForm.description} onChange={(e) => setRegisterForm((prev) => ({ ...prev, description: e.target.value }))} />
        <div className="grid gap-3 md:grid-cols-2">
          <input className="input input-bordered" placeholder="Website" value={registerForm.website} onChange={(e) => setRegisterForm((prev) => ({ ...prev, website: e.target.value }))} />
          <input className="input input-bordered" placeholder="GitHub" value={registerForm.github} onChange={(e) => setRegisterForm((prev) => ({ ...prev, github: e.target.value }))} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="input input-bordered" placeholder="Token symbol" value={registerForm.tokenSymbol} onChange={(e) => setRegisterForm((prev) => ({ ...prev, tokenSymbol: e.target.value.toUpperCase() }))} />
          <input className="input input-bordered" placeholder="Total supply" value={registerForm.totalSupply} onChange={(e) => setRegisterForm((prev) => ({ ...prev, totalSupply: e.target.value }))} />
        </div>
        <button className="btn btn-primary w-full md:w-auto" disabled={loading || !isReady || STARTUP_APP_ID === 0} onClick={handleRegisterStartup}>
          {loading ? 'Submitting…' : 'Register startup'}
        </button>
      </section>

      <section className="grid gap-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-slate-900">Step 2 · Token parameters</h3>
        <p className="text-xs text-slate-500">
          Tokenization minimum: {formatAlgoAmount(snapshot?.tokenizationFee ?? 0)} ALGO · Registered startup id: {startupId ?? '—'}
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="input input-bordered" placeholder="ASA id" value={tokenForm.assetId} onChange={(e) => setTokenForm((prev) => ({ ...prev, assetId: e.target.value }))} />
          <input className="input input-bordered" placeholder="Price per token (microAlgo)" value={tokenForm.pricePerToken} onChange={(e) => setTokenForm((prev) => ({ ...prev, pricePerToken: e.target.value }))} />
        </div>
        <div className="grid gap-3 md:grid-cols-2 items-center">
          <label className="label cursor-pointer">
            <span className="label-text">Tradable immediately</span>
            <input type="checkbox" className="toggle toggle-success" checked={tokenForm.tradable} onChange={(e) => setTokenForm((prev) => ({ ...prev, tradable: e.target.checked }))} />
          </label>
          <input className="input input-bordered" placeholder="Liquidity deposit (microAlgo)" value={tokenForm.liquidityDeposit} onChange={(e) => setTokenForm((prev) => ({ ...prev, liquidityDeposit: e.target.value }))} />
        </div>
        <button className="btn btn-secondary w-full md:w-auto" disabled={loading || !isReady || startupId === null} onClick={handleConfigureToken}>
          {loading ? 'Submitting…' : 'Save token settings'}
        </button>
      </section>

      <section className="grid gap-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-slate-900">Step 3 · Price controls</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input className="input input-bordered" placeholder="New price (microAlgo)" value={priceForm.price} onChange={(e) => setPriceForm({ price: e.target.value })} />
          <button className="btn" disabled={loading || !isReady || startupId === null} onClick={handleUpdatePrice}>
            {loading ? 'Updating…' : 'Update price'}
          </button>
        </div>
        <button className="btn btn-ghost w-full md:w-auto" disabled={refreshing || startupId === null || !isReady} onClick={() => handleFetchStartup()}>
          {refreshing ? 'Refreshing…' : 'Refresh on-chain snapshot'}
        </button>
      </section>

      {startupInfo && (
        <section className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <h3 className="text-lg font-semibold text-emerald-900">On-chain startup profile</h3>
            <span className="badge badge-outline">ASA #{startupInfo.assetId.toString()}</span>
          </div>
          <p className="text-sm text-emerald-900">{startupInfo.name}</p>
          <p className="text-sm text-emerald-800">{startupInfo.description}</p>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-emerald-900">
            <div>
              <span className="font-medium">Founder:</span> {startupInfo.founder}
            </div>
            <div>
              <span className="font-medium">Token symbol:</span> {startupInfo.tokenSymbol}
            </div>
            <div>
              <span className="font-medium">Price:</span> {formatAlgoAmount(startupInfo.pricePerToken)} ALGO
            </div>
            <div>
              <span className="font-medium">Liquidity:</span> {formatAlgoAmount(startupInfo.liquidityMicroalgos)} ALGO
            </div>
            <div>
              <span className="font-medium">Total supply:</span> {startupInfo.totalSupply.toString()}
            </div>
            <div>
              <span className="font-medium">Tradable:</span> {startupInfo.tradable ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-medium">Website:</span> {startupInfo.website || '—'}
            </div>
            <div>
              <span className="font-medium">GitHub:</span> {startupInfo.github || '—'}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default StartupTokenizationForm
