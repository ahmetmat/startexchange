import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'

import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import { StartupTokenizationForm } from './components/tokenization/StartupTokenizationForm'

const Home: React.FC = () => {
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [openDemoModal, setOpenDemoModal] = useState(false)
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => setOpenWalletModal((prev) => !prev)
  const toggleDemoModal = () => setOpenDemoModal((prev) => !prev)

  return (
    <div className="min-h-screen bg-slate-100">
      <section className="hero bg-gradient-to-br from-teal-500 via-sky-500 to-cyan-500 text-white">
        <div className="hero-content text-center p-6 md:p-12">
          <div className="max-w-2xl bg-white/90 text-slate-900 backdrop-blur rounded-2xl shadow-lg p-8 space-y-6">
            <h1 className="text-4xl font-semibold">
              Tokenize founder equity with <span className="font-bold text-teal-600">AlgoKit</span>
            </h1>
            <p className="text-base text-slate-600">
              Capture startup metadata, stream liquidity into Algorand localnet, and mint ASA-backed ownership the moment you connect your wallet.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <a
                data-test-id="getting-started"
                className="btn btn-primary"
                target="_blank"
                rel="noreferrer"
                href="https://github.com/algorandfoundation/algokit-cli"
              >
                AlgoKit docs
              </a>
              <button data-test-id="connect-wallet" className="btn" onClick={toggleWalletModal}>
                Wallet connection
              </button>
              <button className="btn btn-outline" onClick={toggleDemoModal} disabled={!activeAddress}>
                Transactions demo
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <StartupTokenizationForm />
      </main>

      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      <Transact openModal={openDemoModal} setModalState={setOpenDemoModal} />
    </div>
  )
}

export default Home
