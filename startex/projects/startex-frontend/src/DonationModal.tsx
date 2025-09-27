    'use client'

    import { useEffect, useState } from 'react'
    import { X, Sparkles } from 'lucide-react'

    type DonationModalProps = {
    isOpen: boolean
    onClose: () => void
    minAmount: number
    title: string
    description?: string
    confirmLabel?: string
    requireTxId?: boolean
    txIdLabel?: string
    onConfirm: (amount: number, txId: string) => Promise<void> | void
    }

    export function DonationModal({
    isOpen,
    onClose,
    minAmount,
    title,
    description,
    confirmLabel = 'Complete Donation',
    requireTxId = false,
    txIdLabel = 'Transaction ID',
    onConfirm,
    }: DonationModalProps) {
    const [amount, setAmount] = useState(() => minAmount.toString())
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [txId, setTxId] = useState('')

    useEffect(() => {
        if (isOpen) {
        setAmount(minAmount.toString())
        setError(null)
        setSuccessMessage(null)
        setIsSubmitting(false)
        setTxId('')
        }
    }, [isOpen, minAmount])

    if (!isOpen) return null

    const handleConfirm = async () => {
        const parsedAmount = Number(amount)
        if (Number.isNaN(parsedAmount)) {
        setError('Lütfen geçerli bir STX miktarı girin.')
        return
        }

        if (parsedAmount < minAmount) {
        setError(`Minimum bağış tutarı ${minAmount} STX.`)
        return
        }

        if (requireTxId && txId.trim().length === 0) {
        setError('Lütfen doğrulama için bir işlem kimliği (TXID) girin.')
        return
        }

        setError(null)
        setIsSubmitting(true)
        try {
        await onConfirm(parsedAmount, txId.trim())
        setSuccessMessage(`${parsedAmount.toFixed(2)} STX bağışınız başarıyla hazırlandı!`)
        } catch (err) {
        console.error('Donation failed', err)
        setError(err instanceof Error ? err.message : 'Bağış tamamlanamadı. Lütfen tekrar deneyin.')
        } finally {
        setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        if (isSubmitting) return
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={handleClose} />

        <div className="relative w-full max-w-lg bg-white/95 backdrop-blur rounded-3xl shadow-2xl border border-orange-200 p-8 space-y-6">
            <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Kapat"
            >
            <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
            </div>
            </div>

            <div className="space-y-2">
            <label htmlFor="donation-amount" className="text-sm font-medium text-gray-700">
                Bağış Miktarı (STX)
            </label>
            <input
                id="donation-amount"
                type="number"
                min={minAmount}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500"
                placeholder={`${minAmount} veya üzeri`}
                disabled={isSubmitting || !!successMessage}
            />
            <p className="text-xs text-gray-500">Minimum bağış tutarı {minAmount} STX.</p>
            </div>

            {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">
                {error}
            </div>
            )}

            {requireTxId && (
            <div className="space-y-2">
                <label htmlFor="donation-txid" className="text-sm font-medium text-gray-700">
                {txIdLabel}
                </label>
                <input
                id="donation-txid"
                type="text"
                value={txId}
                onChange={(event) => setTxId(event.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-orange-500"
                disabled={isSubmitting || !!successMessage}
                spellCheck={false}
                />
                <p className="text-xs text-gray-500">İşlem zincire işlendiğinde wallet tarafından verilen TX kimliği gereklidir.</p>
            </div>
            )}

            {successMessage && (
            <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm">
                {successMessage}
            </div>
            )}

            <div className="flex items-center justify-end space-x-3">
            <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-800"
                disabled={isSubmitting}
            >
                İptal
            </button>
            <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting || !!successMessage}
                className={`px-5 py-3 text-sm font-semibold rounded-xl text-white transition-all ${
                successMessage
                    ? 'bg-green-500'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                }`}
            >
                {successMessage ? 'Tamamlandı' : isSubmitting ? 'Gönderiliyor…' : confirmLabel}
            </button>
            </div>
        </div>
        </div>
    )
    }