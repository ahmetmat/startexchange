import React, { useEffect, useState } from 'react'
import { peraConnect, getPrimaryAccount, disconnect } from '@/services/algorand/pera'

export function HeaderWalletControls() {
  const [account, setAccount] = useState<string | null>(null)

  useEffect(() => {
    getPrimaryAccount().then(setAccount).catch(() => setAccount(null))
  }, [])

  const connect = async () => {
    const addr = await peraConnect()
    setAccount(addr)
  }

  const onDisconnect = async () => {
    await disconnect()
    setAccount(null)
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {account ? (
        <>
          <span style={{ fontFamily: 'monospace' }}>
            {account.slice(0, 6)}…{account.slice(-6)}
          </span>
          <button onClick={onDisconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={connect}>Connect Pera</button>
      )}
    </div>
  )
}