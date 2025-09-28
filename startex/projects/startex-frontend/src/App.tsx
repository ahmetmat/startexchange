// src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react';
import { SnackbarProvider } from 'notistack';

// Utils, Configs ve Hooks
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs';
import { AlgorandProvider } from './hooks/useAlgorand';

// Bileşenler
import ErrorBoundary from './components/ErrorBoundary';
import MainHeader from './components/MainHeader'; // Ana başlık bileşeni

// Sayfaları React.lazy ile tembel yükleme
const Homepage = React.lazy(() => import('./Homepage'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Competitions = React.lazy(() => import('./components/Competitions'));
const Leaderboard = React.lazy(() => import('./components/leaderboard'));
const Trading = React.lazy(() => import('./components/trading'));
const Startups = React.lazy(() => import('./components/Startups'));
const Register = React.lazy(() => import('./register/page'));

// --- YÜKLEME BİLEŞENİ ---
const PageLoader: React.FC = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 font-semibold">Sayfa Yükleniyor...</p>
    </div>
  </div>
);

// --- 404 NOT FOUND SAYFASI ---
const NotFoundPage: React.FC = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🚀</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Sayfa Bulunamadı</h1>
        <p className="text-xl text-gray-600 mb-8">
          Aradığınız sayfa mevcut değil.
        </p>
        <Link 
          to="/"
          className="bg-gradient-to-r from-black to-cyan-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
  

// --- ANA NAVİGASYON ---
const NavigationHeader: React.FC = () => {
    const navItems = [
      { id: 'home', label: 'Ana Sayfa', path: '/' },
      { id: 'startups', label: 'Startuplar', path: '/startups' },
      { id: 'dashboard', label: 'Panel', path: '/dashboard' },
      { id: 'competitions', label: 'Yarışmalar', path: '/competitions' },
      { id: 'leaderboard', label: 'Lider Tablosu', path: '/leaderboard' },
      { id: 'trading', label: 'Alım/Satım', path: '/trading' },
    ];
  
    return (
      <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-r from-black to-cyan-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🚀</span>
              </div>
              <span className="text-2xl font-black text-black">StartEx</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors ${
                      isActive ? 'text-cyan-600' : 'text-gray-600 hover:text-black'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
  
            <div className="flex items-center space-x-4">
               {/* Cüzdan Bağlama Bileşeni Buraya Gelebilir */}
              <Link
                to="/register"
                className="bg-gradient-to-r from-black to-cyan-600 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
              >
                Startup Kaydet
              </Link>
            </div>
          </div>
        </nav>
      </header>
    );
  };

// --- CÜZDAN YAPILANDIRMASI ---
let supportedWallets: SupportedWallet[];
if (import.meta.env.VITE_ALGOD_NETWORK === 'localnet') {
  const kmdConfig = getKmdConfigFromViteEnvironment();
  supportedWallets = [
    {
      id: WalletId.KMD,
      options: {
        baseServer: kmdConfig.server,
        token: String(kmdConfig.token),
        port: String(kmdConfig.port),
      },
    },
  ];
} else {
  supportedWallets = [
    { id: WalletId.DEFLY },
    { id: WalletId.PERA },
    { id: WalletId.EXODUS },
  ];
}
const network = import.meta.env.VITE_ALGOD_NETWORK || 'testnet';


const algodConfig = getAlgodConfigFromViteEnvironment();
const walletManager = new WalletManager({
  wallets: supportedWallets,
  defaultNetwork: network, // Hangi ağın varsayılan olacağını .env dosyasından alıyoruz.
  networks: {
    // LocalNet yapılandırması
    localnet: {
      algod: {
        baseServer: 'http://localhost',
        port: 4001,
        token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      },
    },
    // TestNet yapılandırması (Herkese açık AlgoNode sunucusu)
    testnet: {
      algod: {
        baseServer: 'https://testnet-api.algonode.cloud',
        port: 443,
        token: '',
      },
    },
  },
});

// --- ANA APP BİLEŞENİ ---
export default function App() {
  return (
    <ErrorBoundary>
      <SnackbarProvider maxSnack={3}>
        <WalletProvider manager={walletManager}>
          <AlgorandProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <NavigationHeader />
                <main>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Homepage />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/startups" element={<Startups />} />
                      <Route path="/competitions" element={<Competitions />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/trading" element={<Trading />} />
                      <Route path="/register" element={<Register />} />
                      {/* Eşleşmeyen tüm yollar için 404 sayfası */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
            </Router>
          </AlgorandProvider>
        </WalletProvider>
      </SnackbarProvider>
    </ErrorBoundary>
  );
}
