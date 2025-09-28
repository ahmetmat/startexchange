import algosdk from 'algosdk'

// .env.local içine bunları koy:
// VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
// VITE_ALGOD_TOKEN=
// VITE_ALGOD_PORT=

export function getAlgod() {
  const server = import.meta.env.VITE_ALGOD_SERVER || 'https://testnet-api.algonode.cloud'
  const token = (import.meta.env.VITE_ALGOD_TOKEN || '').trim()
  const port = (import.meta.env.VITE_ALGOD_PORT || '').trim()
  return new algosdk.Algodv2(token, server, port || undefined)
}