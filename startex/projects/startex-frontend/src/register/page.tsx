
    'use client'

    import { useState } from 'react'
    import "tailwindcss";
    import { upsertStartupProfileWithMetrics } from '../lib/firebase/firestore'

    import {
    Rocket, Github, Twitter, Globe, ArrowRight, CheckCircle,
    AlertCircle, Sparkles, Zap, Coins, Wallet
    } from 'lucide-react'
    import { useAlgorand, useWallet } from '../hooks/useAlgorand'

    type FormData = {
    name: string
    description: string
    githubRepo: string
    website: string
    twitter: string
    tokenName: string
    tokenSymbol: string
    initialSupply: string
    decimals: string
    }

    type Errors = Partial<Record<keyof FormData, string>>

    export default function StartupRegister() {
    const { isConnected, address, connect, disconnect } = useWallet()
    const { registerStartup, tokenizeStartup, updateMetrics } = useAlgorand()
    
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<Errors>({})
    const [startupId, setStartupId] = useState<number | null>(null)
    const [assetId, setAssetId] = useState<number | null>(null)
    const [txIds, setTxIds] = useState<{ register?: string; tokenize?: string; metrics?: string }>({})
    
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        githubRepo: '',
        website: '',
        twitter: '',
        tokenName: '',
        tokenSymbol: '',
        initialSupply: '1000000',
        decimals: '6',
    })
    
    const [selectedWallet, setSelectedWallet] = useState<'pera' | 'defly' | 'daffi' | null>(null)
    const [showWalletModal, setShowWalletModal] = useState(false)
    
    const handleConnectWallet = async (walletType: 'pera' | 'defly' | 'daffi') => {
        try {
        await connect(walletType)
        setSelectedWallet(walletType)
        setShowWalletModal(false)
        } catch (error) {
        console.error('Failed to connect wallet:', error)
        alert('Failed to connect wallet. Please try again.')
        }
    }
    
    const handleDisconnectWallet = async () => {
        await disconnect()
        setSelectedWallet(null)
    }
    
    const validateStep = (step: number) => {
        const e: Errors = {}
        
        if (step === 1) {
        if (!formData.name.trim()) e.name = 'Startup name is required'
        if (!formData.description.trim()) e.description = 'Description is required'
        if (!formData.githubRepo.trim()) e.githubRepo = 'GitHub repository is required'
        if (formData.githubRepo && !/^https?:\/\/(www\.)?github\.com\//i.test(formData.githubRepo)) {
            e.githubRepo = 'Please enter a valid GitHub URL'
        }
        }
        
        if (step === 2) {
        if (!formData.tokenName.trim()) e.tokenName = 'Token name is required'
        if (!formData.tokenSymbol.trim()) e.tokenSymbol = 'Token symbol is required'
        if (formData.tokenSymbol.length > 8) e.tokenSymbol = 'Max 8 characters for Algorand ASA'
        if (!formData.initialSupply || Number.isNaN(Number(formData.initialSupply)) || parseInt(formData.initialSupply) < 1) {
            e.initialSupply = 'Initial supply must be a positive number'
        }
        if (Number(formData.decimals) > 19) e.decimals = 'Decimals must be ≤ 19 for Algorand'
        }
        
        setErrors(e)
        return Object.keys(e).length === 0
    }
    
    const nextStep = () => {
        if (validateStep(currentStep)) setCurrentStep((s) => ((s + 1) as 1 | 2 | 3 | 4))
    }
    
    const prevStep = () => {
        setCurrentStep((s) => ((Math.max(1, s - 1)) as 1 | 2 | 3 | 4))
        setErrors({})
    }
    
    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return
        if (!isConnected || !address) {
        alert('Please connect your wallet first.')
        return
        }
        
        setIsSubmitting(true)
        try {
        // 1) Register startup
        console.log('Step 1: Registering startup...')
        const newStartupId = await registerStartup({
            name: formData.name.trim(),
            description: formData.description.trim(),
            githubRepo: formData.githubRepo.trim(),
            website: formData.website?.trim(),
            twitter: formData.twitter?.trim(),
        })
        
        setStartupId(newStartupId)
        console.log('Startup registered with ID:', newStartupId)
        
        // 2) Tokenize startup
        console.log('Step 2: Tokenizing startup...')
        const newAssetId = await tokenizeStartup({
            startupId: newStartupId,
            tokenName: formData.tokenName.trim(),
            tokenSymbol: formData.tokenSymbol.trim(),
            totalSupply: parseInt(formData.initialSupply),
            decimals: parseInt(formData.decimals),
        })
        
        setAssetId(newAssetId)
        console.log('Token created with Asset ID:', newAssetId)
        
        // 3) Initialize metrics (optional - can be done by oracle)
        console.log('Step 3: Initializing metrics...')
        try {
            // Fetch GitHub stats
            const githubUrl = formData.githubRepo.trim()
            const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
            
            if (match) {
            const [, owner, repo] = match
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
            const data = await response.json()
            
            if (data) {
                await updateMetrics({
                startupId: newStartupId,
                commits: 0, // Would need to fetch separately
                stars: data.stargazers_count || 0,
                forks: data.forks_count || 0,
                })
                console.log('Metrics initialized')
            }
            }
        } catch (error) {
            console.error('Failed to initialize metrics:', error)
            // Non-critical error, continue
        }
        
        // 4) Sync to Firebase
        console.log('Step 4: Syncing to Firebase...')
        try {
            await upsertStartupProfileWithMetrics({
            id: newStartupId.toString(),
            ownerAddress: address,
            name: formData.name.trim(),
            description: formData.description.trim(),
            github: formData.githubRepo.trim(),
            website: formData.website?.trim(),
            twitter: formData.twitter?.trim(),
            tokenName: formData.tokenName.trim(),
            tokenSymbol: formData.tokenSymbol.trim(),
            totalSupply: parseInt(formData.initialSupply, 10),
            })
            console.log('Firebase sync completed')
        } catch (syncError) {
            console.error('Firebase sync error (non-fatal):', syncError)
        }
        
        setCurrentStep(4)
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
            if (typeof window !== 'undefined') {
            window.location.href = `/dashboard?startupId=${newStartupId}`
            }
        }, 3000)
        
        } catch (error: any) {
        console.error('Submit error:', error)
        const message = error?.message || 'Error submitting startup. Please try again.'
        alert(message)
        } finally {
        setIsSubmitting(false)
        }
    }

    // Wallet not connected
    if (!isConnected) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto">
            <Rocket className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Connect Your Algorand Wallet</h1>
            <p className="text-gray-600">Choose your preferred wallet to register your startup.</p>
            </div>

            <div className="flex flex-col space-y-3 max-w-sm mx-auto">
            <button
                onClick={() => handleConnectWallet('pera')}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-semibold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
            >
                <Wallet className="w-5 h-5" />
                <span>Connect Pera Wallet</span>
            </button>

            <button
                onClick={() => handleConnectWallet('defly')}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full font-semibold hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center space-x-2"
            >
                <Wallet className="w-5 h-5" />
                <span>Connect Defly Wallet</span>
            </button>

            <button
                onClick={() => handleConnectWallet('daffi')}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center space-x-2"
            >
                <Wallet className="w-5 h-5" />
                <span>Connect Daffi Wallet</span>
            </button>
            </div>

            <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 rounded-full font-semibold bg-white border-2 border-orange-300 hover:border-orange-400 text-orange-700 transition-all"
            >
            Go Back
            </button>
        </div>
        </div>
    )
    }
    
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 py-12">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div className="text-center space-y-4">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-6 py-3 rounded-full border border-orange-200">
                <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
                <span className="text-orange-700 font-semibold">Launch on Algorand</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900">
                Register Your
                <span className="block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent"> Startup</span>
            </h1>
            <p className="text-xl text-gray-600">Create your ASA token and join the ecosystem 🚀</p>
            <div className="mt-2 text-sm text-gray-500">
                Connected:&nbsp;
                <span className="font-mono">{address?.slice(0, 8)}...{address?.slice(-4)}</span>
                <button onClick={handleDisconnectWallet} className="ml-3 text-orange-600 hover:underline">Disconnect</button>
            </div>
            </div>
        </div>
        
        {/* Progress */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    currentStep >= step
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white scale-110'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                >
                    {currentStep > step ? <CheckCircle className="w-6 h-6" /> : step}
                </div>
                {step < 3 && (
                    <div
                    className={`w-16 h-1 transition-all duration-300 ${
                        currentStep > step ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gray-200'
                    }`}
                    />
                )}
                </div>
            ))}
            </div>
            
            <div className="flex justify-center mt-4 space-x-16">
            <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>Basic Info</span>
            <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>ASA Token</span>
            <span className={`text-sm font-medium ${currentStep >= 3 ? 'text-orange-600' : 'text-gray-400'}`}>Review</span>
            </div>
        </div>
        
        {/* Form Card */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-orange-200 overflow-hidden">
            {/* STEP 1 */}
            {currentStep === 1 && (
                <div className="p-8 space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto">
                    <Rocket className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Tell us about your startup</h2>
                    <p className="text-gray-600">Let's start with the basics</p>
                </div>
                
                <div className="space-y-6">
                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Startup Name *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                        errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                        }`}
                        placeholder="e.g. TechStartup"
                    />
                    {errors.name && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.name}
                        </p>
                    )}
                    </div>
                    
                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all resize-none ${
                        errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                        }`}
                        placeholder="Describe your startup's mission and vision..."
                    />
                    {errors.description && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.description}
                        </p>
                    )}
                    </div>
                    
                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Github className="w-4 h-4 inline mr-1" />
                        GitHub Repository *
                    </label>
                    <input
                        type="url"
                        value={formData.githubRepo}
                        onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                        errors.githubRepo ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                        }`}
                        placeholder="https://github.com/username/repository"
                    />
                    {errors.githubRepo && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.githubRepo}
                        </p>
                    )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Globe className="w-4 h-4 inline mr-1" />
                        Website (Optional)
                        </label>
                        <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-all"
                        placeholder="https://yourwebsite.com"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Twitter className="w-4 h-4 inline mr-1" />
                        Twitter (Optional)
                        </label>
                        <input
                        type="text"
                        value={formData.twitter}
                        onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-all"
                        placeholder="@yourstartup"
                        />
                    </div>
                    </div>
                </div>
                
                <button
                    onClick={nextStep}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                    <span>Continue to Tokenization</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
                </div>
            )}
            
            {/* STEP 2 */}
            {currentStep === 2 && (
                <div className="p-8 space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto">
                    <Coins className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Create Your ASA Token</h2>
                    <p className="text-gray-600">Algorand Standard Asset configuration</p>
                </div>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Token Name *</label>
                        <input
                        type="text"
                        value={formData.tokenName}
                        onChange={(e) => setFormData({ ...formData, tokenName: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                            errors.tokenName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                        }`}
                        placeholder="e.g. TechCoin"
                        />
                        {errors.tokenName && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.tokenName}
                        </p>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Token Symbol *</label>
                        <input
                        type="text"
                        value={formData.tokenSymbol}
                        onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value.toUpperCase() })}
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                            errors.tokenSymbol ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                        }`}
                        placeholder="TECH"
                        maxLength={8}
                        />
                        {errors.tokenSymbol && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.tokenSymbol}
                        </p>
                        )}
                    </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Supply *</label>
                        <input
                        type="number"
                        value={formData.initialSupply}
                        onChange={(e) => setFormData({ ...formData, initialSupply: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                            errors.initialSupply ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'
                        }`}
                        placeholder="1000000"
                        min={1}
                        />
                        {errors.initialSupply && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.initialSupply}
                        </p>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Decimals (≤ 19)</label>
                        <select
                        value={formData.decimals}
                        onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 ${
                            errors.decimals ? 'border-red-300' : 'border-gray-200'
                        } focus:border-orange-500 focus:outline-none transition-all`}
                        >
                        <option value="6">6</option>
                        <option value="8">8</option>
                        <option value="0">0</option>
                        <option value="2">2</option>
                        <option value="4">4</option>
                        <option value="10">10</option>
                        <option value="12">12</option>
                        </select>
                        {errors.decimals && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.decimals}
                        </p>
                        )}
                    </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                        <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div className="text-sm text-blue-700">
                        <p className="font-semibold mb-1">Tokenization Fee: 1 ALGO</p>
                        <p>This fee is required for creating an ASA on Algorand.</p>
                        <p className="mt-1">Your token will be a standard Algorand asset with full ecosystem compatibility.</p>
                        </div>
                    </div>
                    </div>
                </div>
                
                <div className="flex space-x-4">
                    <button
                    onClick={prevStep}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 rounded-xl font-bold text-lg transition-all"
                    >
                    Back
                    </button>
                    <button
                    onClick={nextStep}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                    >
                    <span>Review & Submit</span>
                    <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
                </div>
            )}
            
            {/* STEP 3 (Review) */}
            {currentStep === 3 && (
                <div className="p-8 space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Review Your Startup</h2>
                    <p className="text-gray-600">Make sure everything looks correct before launching</p>
                </div>
                
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">Startup Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                        <span className="text-gray-600">Name:</span>
                        <p className="font-semibold text-gray-900">{formData.name}</p>
                        </div>
                        <div>
                        <span className="text-gray-600">GitHub:</span>
                        <p className="font-semibold text-gray-900 truncate">{formData.githubRepo}</p>
                        </div>
                        <div className="md:col-span-2">
                        <span className="text-gray-600">Description:</span>
                        <p className="font-semibold text-gray-900">{formData.description}</p>
                        </div>
                        {formData.website && (
                        <div>
                            <span className="text-gray-600">Website:</span>
                            <p className="font-semibold text-gray-900">{formData.website}</p>
                        </div>
                        )}
                        {formData.twitter && (
                        <div>
                            <span className="text-gray-600">Twitter:</span>
                            <p className="font-semibold text-gray-900">{formData.twitter}</p>
                        </div>
                        )}
                    </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">ASA Token Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                        <span className="text-gray-600">Token Name:</span>
                        <p className="font-semibold text-gray-900">{formData.tokenName}</p>
                        </div>
                        <div>
                        <span className="text-gray-600">Symbol:</span>
                        <p className="font-semibold text-gray-900">{formData.tokenSymbol}</p>
                        </div>
                        <div>
                        <span className="text-gray-600">Initial Supply:</span>
                        <p className="font-semibold text-gray-900">
                            {parseInt(formData.initialSupply).toLocaleString()}
                        </p>
                        </div>
                        <div>
                        <span className="text-gray-600">Decimals:</span>
                        <p className="font-semibold text-gray-900">{formData.decimals}</p>
                        </div>
                    </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Transaction Details</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        <p>✅ Startup will be registered on Algorand blockchain</p>
                        <p>✅ ASA token will be created with specified parameters</p>
                        <p>✅ You will receive the total supply in your wallet</p>
                        <p>✅ 1 ALGO fee will be charged for tokenization</p>
                    </div>
                    </div>
                </div>
                
                <div className="flex space-x-4">
                    <button
                    onClick={prevStep}
                    disabled={isSubmitting}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50"
                    >
                    Back
                    </button>
                    <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {isSubmitting ? (
                        <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                        <>
                        <span>Confirm & Launch</span>
                        <Rocket className="w-5 h-5" />
                        </>
                    )}
                    </button>
                </div>
                </div>
            )}
            
            {/* STEP 4 (Success) */}
            {currentStep === 4 && (
                <div className="p-8 text-center space-y-8">
                <div className="space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900">🎉 Congratulations!</h2>
                    <p className="text-xl text-gray-600">
                    Your startup has been successfully registered on Algorand!
                    </p>
                    {startupId !== null && (
                    <div className="space-y-2">
                        <p className="font-semibold">
                        Startup ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{startupId}</span>
                        </p>
                        {assetId !== null && (
                        <p className="font-semibold">
                            Asset ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{assetId}</span>
                        </p>
                        )}
                    </div>
                    )}
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">What's Next?</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                    <p>✅ Your startup is now live on Algorand</p>
                    <p>✅ Your ASA token is ready for trading</p>
                    <p>✅ You can start participating in competitions</p>
                    <p>✅ Begin building your community</p>
                    </div>
                </div>
                
                <div className="text-gray-600">
                    Redirecting to dashboard in 3 seconds...
                </div>
                </div>
            )}
            </div>
        </div>
        </div>
        )
    }
