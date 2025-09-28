import React, { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle, Loader2, Rocket, Wallet } from 'lucide-react'

import { useAlgorand } from '../hooks/useAlgorand'
import type { LaunchedStartupRecord } from '../lib/startupStorage'

export type StartupLaunchFormProps = {
  isConnected: boolean
  isConnecting: boolean
  address: string | null
  onConnect: () => Promise<void> | void
  onLaunchComplete?: (record: LaunchedStartupRecord) => void
}

type FormState = {
  name: string
  description: string
  category: string
  website: string
  github: string
  twitter: string
  tokenName: string
  tokenSymbol: string
  totalSupply: string
  decimals: string
  initialPrice: string
}

type ValidationErrors = Record<string, string>

const defaultForm: FormState = {
  name: '',
  description: '',
  category: '',
  website: '',
  github: '',
  twitter: '',
  tokenName: '',
  tokenSymbol: '',
  totalSupply: '1000000',
  decimals: '6',
  initialPrice: '1.00',
}

const steps = [
  {
    id: 0,
    title: 'Connect Wallet',
    detail: 'Link your Pera Wallet to unlock startup launch tools.',
  },
  {
    id: 1,
    title: 'Startup Profile',
    detail: 'Tell investors what you are building and why it matters.',
  },
  {
    id: 2,
    title: 'Token Settings',
    detail: 'Define Algorand Standard Asset parameters for your token.',
  },
  {
    id: 3,
    title: 'Review & Launch',
    detail: 'Double-check your details before going on-chain.',
  },
]

function formatAddress(address: string | null) {
  if (!address) return 'Not connected'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function isPositiveInteger(value: string) {
  if (!value.trim()) return false
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 && Number.isInteger(parsed)
}

function isValidDecimals(value: string) {
  if (!value.trim()) return false
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 19
}

export function StartupLaunchForm({ isConnected, isConnecting, address, onConnect, onLaunchComplete }: StartupLaunchFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormState>(defaultForm)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [launchSummary, setLaunchSummary] = useState<{
    startupId?: number
    assetId?: number
    registerTxId?: string
    tokenizeTxId?: string
  }>({})

  const { registerStartup, tokenizeStartup, updateMetrics } = useAlgorand()

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const { [field]: _removed, ...rest } = prev
      return rest
    })
  }

  const walletErrors = useMemo(() => {
    if (isConnected) return {}
    return { wallet: 'Connect your Algorand wallet to continue.' }
  }, [isConnected])

  const startupErrors = useMemo(() => {
    const nextErrors: ValidationErrors = {}
    if (!formData.name.trim()) nextErrors.name = 'Startup name is required.'
    if (!formData.description.trim()) nextErrors.description = 'Share a short description.'
    if (!formData.github.trim()) {
      nextErrors.github = 'Add your GitHub repository URL.'
    } else if (!/^https?:\/\/(www\.)?github\.com\//i.test(formData.github.trim())) {
      nextErrors.github = 'Enter a valid GitHub repository URL.'
    }
    if (formData.website && !/^https?:\/\//i.test(formData.website.trim())) {
      nextErrors.website = 'Website URLs must include http(s)://.'
    }
    if (formData.twitter && !/^@?\w{1,15}$/i.test(formData.twitter.trim())) {
      nextErrors.twitter = 'Use a valid X/Twitter handle (without spaces).'
    }
    return nextErrors
  }, [formData.description, formData.github, formData.name, formData.twitter, formData.website])

  const tokenErrors = useMemo(() => {
    const nextErrors: ValidationErrors = {}
    if (!formData.tokenName.trim()) nextErrors.tokenName = 'Name your token.'
    if (!formData.tokenSymbol.trim()) {
      nextErrors.tokenSymbol = 'Add a token symbol (max 8 characters).'
    } else if (formData.tokenSymbol.trim().length > 8) {
      nextErrors.tokenSymbol = 'Token symbols cannot exceed 8 characters.'
    }
    if (!isPositiveInteger(formData.totalSupply)) {
      nextErrors.totalSupply = 'Set a positive integer total supply.'
    }
    if (!isValidDecimals(formData.decimals)) {
      nextErrors.decimals = 'Decimals must be between 0 and 19.'
    }
    if (!formData.initialPrice.trim() || Number.isNaN(Number(formData.initialPrice)) || Number(formData.initialPrice) <= 0) {
      nextErrors.initialPrice = 'Set a positive launch price in ALGOs.'
    }
    return nextErrors
  }, [formData.decimals, formData.initialPrice, formData.tokenName, formData.tokenSymbol, formData.totalSupply])

  const isStepReady = useMemo(() => {
    switch (currentStep) {
      case 0:
        return isConnected
      case 1:
        return Object.keys(startupErrors).length === 0 && formData.name.trim() && formData.description.trim() && formData.github.trim()
      case 2:
        return Object.keys(tokenErrors).length === 0 && formData.tokenName.trim() && formData.tokenSymbol.trim()
      default:
        return true
    }
  }, [currentStep, formData.description, formData.github, formData.name, formData.tokenName, formData.tokenSymbol, isConnected, startupErrors, tokenErrors])

  const validateStep = (stepIndex: number) => {
    let aggregated: ValidationErrors = {}
    switch (stepIndex) {
      case 0:
        aggregated = walletErrors
        break
      case 1:
        aggregated = startupErrors
        break
      case 2:
        aggregated = tokenErrors
        break
      case 3:
        aggregated = { ...walletErrors, ...startupErrors, ...tokenErrors }
        break
      default:
        aggregated = {}
    }
    setErrors(aggregated)
    return Object.keys(aggregated).length === 0
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return
    setErrors({})
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1))
  }

  const handlePrev = () => {
    setErrors({})
    setSubmissionError(null)
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  const handleLaunch = async () => {
    if (!validateStep(3)) return
    if (!isConnected || !address) {
      setErrors((prev) => ({ ...prev, wallet: 'Connect your wallet before launching.' }))
      setSubmissionError('Connect your wallet before launching the tokenization workflow.')
      setSubmissionState('error')
      return
    }

    setSubmissionState('submitting')
    setLaunchSummary({})
    setSubmissionError(null)

    try {
      const trimmedSymbol = formData.tokenSymbol.trim().toUpperCase()
      const trimmedName = formData.tokenName.trim()
      const totalSupply = parseInt(formData.totalSupply, 10)
      const decimals = parseInt(formData.decimals, 10)
      const launchPrice = Number(formData.initialPrice)

      const { startupId, txId: registerTxId } = await registerStartup({
        name: formData.name.trim(),
        description: formData.description.trim(),
        githubRepo: formData.github.trim(),
        website: formData.website.trim() || undefined,
        twitter: formData.twitter.trim() || undefined,
      })

      const { assetId, txId: tokenizeTxId } = await tokenizeStartup({
        startupId,
        tokenName: trimmedName,
        tokenSymbol: trimmedSymbol,
        totalSupply,
        decimals,
      })

      try {
        if (formData.github.trim()) {
          const match = formData.github.trim().match(/github\.com\/([^\/]+)\/([^\/]+)/i)
          if (match) {
            const [, owner, repo] = match
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
            if (response.ok) {
              const data = await response.json()
              await updateMetrics({
                startupId,
                commits: 0,
                stars: data?.stargazers_count ?? 0,
                forks: data?.forks_count ?? 0,
              })
            }
          }
        }
      } catch (metricsError) {
        console.warn('Metrics hydration skipped', metricsError)
      }

      const record: LaunchedStartupRecord = {
        startupId,
        assetId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        website: formData.website.trim() || undefined,
        github: formData.github.trim() || undefined,
        twitter: formData.twitter.trim() || undefined,
        tokenName: trimmedName || `${trimmedSymbol} Token`,
        tokenSymbol: trimmedSymbol,
        totalSupply,
        decimals,
        launchPrice,
        founderAddress: address,
        registerTxId,
        tokenizeTxId,
        createdAt: new Date().toISOString(),
      }

      setLaunchSummary({ startupId, assetId, registerTxId, tokenizeTxId })
      onLaunchComplete?.(record)
      setSubmissionState('success')
    } catch (error) {
      console.error('Failed to finalize launch', error)
      setSubmissionState('error')
      setSubmissionError(error instanceof Error ? error.message : 'Unable to launch right now. Please retry in a moment.')
    }
  }

  const updateField = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    clearError(field)
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3 lg:flex-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${
                  index <= currentStep
                    ? 'border-cyan-500 bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                    : 'border-gray-200 bg-white text-gray-400'
                }`}
              >
                {index < currentStep ? <CheckCircle className="h-5 w-5" /> : index + 1}
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{step.title}</p>
                <p className="text-xs text-gray-400">{step.detail}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`hidden h-px flex-1 lg:block ${index < currentStep ? 'bg-cyan-400/70' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {currentStep === 0 && (
          <div className="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  <Wallet className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-semibold text-slate-900">
                    {isConnected ? 'Wallet connected' : 'Connect your Algorand wallet'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {isConnected
                      ? `Using ${formatAddress(address)} via Pera Wallet.`
                      : 'Use WalletConnect with Pera Wallet to continue to the next step.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onConnect}
                disabled={isConnecting}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${
                  isConnected
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400'
                } ${isConnecting ? 'opacity-80' : ''}`}
              >
                {isConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isConnected ? 'Disconnect' : 'Connect Pera Wallet'}
              </button>
            </div>
            {errors.wallet && (
              <p className="mt-4 flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {errors.wallet}
              </p>
            )}
          </div>
        )}

        {currentStep === 1 && (
          <div className="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm">
            <div className="space-y-5">
              <div>
                <h4 className="text-xl font-semibold text-slate-900">Tell us about your startup</h4>
                <p className="text-sm text-gray-500">Investors love clarity. Share the essentials below.</p>
              </div>

              <div className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Startup name *</label>
                    <input
                      value={formData.name}
                      onChange={(event) => updateField('name', event.target.value)}
                      className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        errors.name ? 'border-red-300 ring-red-200' : 'border-gray-200'
                      }`}
                      placeholder="e.g. TechFlow AI"
                    />
                    {errors.name && (
                      <p className="mt-2 flex items-center gap-2 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Category</label>
                    <input
                      value={formData.category}
                      onChange={(event) => updateField('category', event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="AI / Climate / Fintech"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Elevator pitch *</label>
                  <textarea
                    value={formData.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    rows={4}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      errors.description ? 'border-red-300 ring-red-200' : 'border-gray-200'
                    }`}
                    placeholder="What problem are you solving and what makes you unique?"
                  />
                  {errors.description && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Website</label>
                    <input
                      value={formData.website}
                      onChange={(event) => updateField('website', event.target.value)}
                      className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        errors.website ? 'border-red-300 ring-red-200' : 'border-gray-200'
                      }`}
                      placeholder="https://yourstartup.com"
                    />
                    {errors.website && (
                      <p className="mt-2 flex items-center gap-2 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {errors.website}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">GitHub repository *</label>
                    <input
                      value={formData.github}
                      onChange={(event) => updateField('github', event.target.value)}
                      className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        errors.github ? 'border-red-300 ring-red-200' : 'border-gray-200'
                      }`}
                      placeholder="https://github.com/user/repo"
                    />
                    {errors.github && (
                      <p className="mt-2 flex items-center gap-2 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {errors.github}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Twitter / X handle</label>
                  <input
                    value={formData.twitter}
                    onChange={(event) => updateField('twitter', event.target.value.replace(/^@+/, '@'))}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      errors.twitter ? 'border-red-300 ring-red-200' : 'border-gray-200'
                    }`}
                    placeholder="@startex"
                  />
                  {errors.twitter && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {errors.twitter}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm">
            <div className="space-y-5">
              <div>
                <h4 className="text-xl font-semibold text-slate-900">Configure your ASA</h4>
                <p className="text-sm text-gray-500">Define how your token will behave on Algorand.</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Token name *</label>
                  <input
                    value={formData.tokenName}
                    onChange={(event) => updateField('tokenName', event.target.value)}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      errors.tokenName ? 'border-red-300 ring-red-200' : 'border-gray-200'
                    }`}
                    placeholder="TechFlow Token"
                  />
                  {errors.tokenName && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {errors.tokenName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Token symbol *</label>
                  <input
                    value={formData.tokenSymbol}
                    onChange={(event) => updateField('tokenSymbol', event.target.value.toUpperCase())}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm uppercase shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      errors.tokenSymbol ? 'border-red-300 ring-red-200' : 'border-gray-200'
                    }`}
                    placeholder="TECH"
                    maxLength={8}
                  />
                  {errors.tokenSymbol && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {errors.tokenSymbol}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Total supply *</label>
                  <input
                    value={formData.totalSupply}
                    onChange={(event) => updateField('totalSupply', event.target.value.replace(/[^0-9]/g, ''))}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      errors.totalSupply ? 'border-red-300 ring-red-200' : 'border-gray-200'
                    }`}
                    placeholder="1000000"
                    inputMode="numeric"
                  />
                  {errors.totalSupply && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {errors.totalSupply}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Decimals *</label>
                  <input
                    value={formData.decimals}
                    onChange={(event) => updateField('decimals', event.target.value.replace(/[^0-9]/g, ''))}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      errors.decimals ? 'border-red-300 ring-red-200' : 'border-gray-200'
                    }`}
                    placeholder="6"
                    inputMode="numeric"
                  />
                  {errors.decimals && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {errors.decimals}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Initial listing price (ALGO) *</label>
                  <input
                    value={formData.initialPrice}
                    onChange={(event) => updateField('initialPrice', event.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      errors.initialPrice ? 'border-red-300 ring-red-200' : 'border-gray-200'
                    }`}
                    placeholder="1.00"
                    inputMode="decimal"
                  />
                  {errors.initialPrice && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {errors.initialPrice}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm">
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-slate-900">Review everything</h4>
                <p className="text-sm text-gray-500">
                  Confirm these details before you deploy. You can always go back to edit.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h5 className="text-sm font-semibold text-slate-800">Founder wallet</h5>
                  <p className="mt-1 text-sm text-gray-500">{formatAddress(address)}</p>
                  {!isConnected && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      Connect your wallet before launching.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <h5 className="text-sm font-semibold text-slate-800">Launch checklist</h5>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>• Startup profile completed</li>
                    <li>• Token parameters validated</li>
                    <li>• Wallet ready for signing</li>
                  </ul>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h5 className="text-sm font-semibold text-slate-800">Startup details</h5>
                  <dl className="mt-2 space-y-2 text-sm text-gray-600">
                    <div>
                      <dt className="font-semibold text-slate-700">Name</dt>
                      <dd>{formData.name || '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">Category</dt>
                      <dd>{formData.category || '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">Website</dt>
                      <dd>{formData.website || '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">GitHub</dt>
                      <dd>{formData.github || '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">Twitter</dt>
                      <dd>{formData.twitter || '—'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <h5 className="text-sm font-semibold text-slate-800">Token preview</h5>
                  <dl className="mt-2 space-y-2 text-sm text-gray-600">
                    <div>
                      <dt className="font-semibold text-slate-700">Token name</dt>
                      <dd>{formData.tokenName || '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">Symbol</dt>
                      <dd>{formData.tokenSymbol || '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">Total supply</dt>
                      <dd>{formData.totalSupply || '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">Decimals</dt>
                      <dd>{formData.decimals || '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">Initial price</dt>
                      <dd>{formData.initialPrice ? `${formData.initialPrice} ALGO` : '—'}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                <p>
                  {submissionState === 'success'
                    ? 'Your registration and tokenization transactions have been confirmed. Keep the receipts below for your records.'
                    : 'Review all information carefully. Once submitted, transactions will execute on Algorand and require wallet approval.'}
                </p>
              </div>

              {submissionError && (
                <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {submissionError}
                </p>
              )}

              {submissionState === 'success' && (
                <>
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    <CheckCircle className="h-5 w-5" />
                    Startup registered and tokenized successfully on Algorand.
                  </div>

                  {(launchSummary.registerTxId || launchSummary.tokenizeTxId) && (
                    <div className="grid gap-4 md:grid-cols-2">
                      {launchSummary.registerTxId && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <h6 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Registry transaction</h6>
                          <p className="mt-2 font-mono text-xs break-all text-gray-700">{launchSummary.registerTxId}</p>
                          {launchSummary.startupId && (
                            <p className="mt-3 text-sm text-gray-500">Startup ID: <span className="font-semibold text-gray-800">{launchSummary.startupId}</span></p>
                          )}
                        </div>
                      )}

                      {launchSummary.tokenizeTxId && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <h6 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Token transaction</h6>
                          <p className="mt-2 font-mono text-xs break-all text-gray-700">{launchSummary.tokenizeTxId}</p>
                          {launchSummary.assetId && (
                            <p className="mt-3 text-sm text-gray-500">Asset ID: <span className="font-semibold text-gray-800">{launchSummary.assetId}</span></p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStep === 0}
          className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition-all ${
            currentStep === 0
              ? 'cursor-not-allowed border-gray-200 text-gray-300'
              : 'border-gray-300 text-gray-600 hover:border-cyan-300 hover:text-cyan-600'
          }`}
        >
          Back
        </button>

        {currentStep < steps.length - 1 && (
          <button
            type="button"
            onClick={handleNext}
            disabled={!isStepReady}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition-all ${
              isStepReady
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            Continue
          </button>
        )}

        {currentStep === steps.length - 1 && (
          <button
            type="button"
            onClick={handleLaunch}
            disabled={submissionState === 'submitting'}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition-all ${
              submissionState === 'submitting'
                ? 'bg-gray-200 text-gray-500'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400'
            }`}
          >
            {submissionState === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {submissionState === 'submitting' ? 'Launching…' : 'Launch Startup Token'}
          </button>
        )}
      </div>
    </div>
  )
}

export default StartupLaunchForm
