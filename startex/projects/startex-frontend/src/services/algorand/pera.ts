import { PeraWalletConnect } from '@perawallet/connect'

const pera = new PeraWalletConnect()

let cachedAccount: string | null = null

export async function peraConnect(): Promise<string> {
  const accounts = await pera.connect()
  const addr = accounts[0]
  cachedAccount = addr
  pera.connector?.on('disconnect', () => { cachedAccount = null })
  return addr
}

export async function getPrimaryAccount(): Promise<string | null> {
  if (cachedAccount) return cachedAccount
  try {
    const reconnected = await pera.reconnectSession()
    if (reconnected.accounts.length > 0) {
      cachedAccount = reconnected.accounts[0]
      return cachedAccount
    }
  } catch { /* no-op */ }
  return null
}

export async function disconnect() {
  try { await pera.disconnect() } finally { cachedAccount = null }
}

// Wallet için imzalama yardımcıları
export async function signTxnsWithPera(txns: Uint8Array[]): Promise<Uint8Array[]> {
  const groups = txns.map((t) => ({ txn: Buffer.from(t).toString('base64') }))
  const signed = await pera.signTransaction([groups])
  // Pera nested array döndürebilir; düzleştir
  const flat = (Array.isArray(signed[0]) ? signed[0] : signed) as { signedTxn: Uint8Array | string }[]
  return flat.map(x => {
    if (x instanceof Uint8Array) return x
    // bazı sürümler base64 string döndürüyor
    if (typeof x === 'string') return Uint8Array.from(Buffer.from(x, 'base64'))
    const anyx = x as any
    if (anyx.signedTxn) return anyx.signedTxn as Uint8Array
    throw new Error('Could not parse signed transactions from Pera')
  })
}