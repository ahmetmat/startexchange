import React, { useState } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  minAmount: number
  title: string
  description?: string
  onConfirm: (amount: number) => Promise<void> | void
}

export function DonationModal({ isOpen, onClose, minAmount, title, description, onConfirm }: Props) {
  const [amount, setAmount] = useState<number>(minAmount)
  if (!isOpen) return null

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.35)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16, zIndex:1000
    }}>
      <div style={{ background:'#fff', borderRadius:12, padding:20, width:'100%', maxWidth:420 }}>
        <h3 style={{ marginTop:0 }}>{title}</h3>
        {description && <p style={{ color:'#555' }}>{description}</p>}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input
            type="number"
            min={minAmount}
            step="0.1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ flex:1, padding:8 }}
            placeholder={`${minAmount} ALGO min.`}
          />
          <span>ALGO</span>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:16 }}>
          <button onClick={onClose}>Vazgeç</button>
          <button onClick={() => onConfirm(amount)}>Gönder</button>
        </div>
      </div>
    </div>
  )
}