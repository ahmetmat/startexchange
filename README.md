# StartEx - Startup Tokenization Platform

A revolutionary platform bridging traditional startup funding and DeFi, built on Algorand blockchain. Convert your startup into tradeable Algorand Standard Assets (ASA) and compete for funding in community-driven competitions.
<img width="1680" height="706" alt="Screenshot 2025-09-28 at 12 15 15" src="https://github.com/user-attachments/assets/a6092d25-e60f-49f2-ba08-e6d0ef460d2a" />

## 🚀 Features

### For Startups
- **One-Click ASA Tokenization**: Convert your startup into tradeable Algorand Standard Assets
- **GitHub Integration**: Automated tracking of repository activity, stars, and commits
- **Competition Platform**: Participate in monthly competitions with real ALGO prizes
- **Real-Time Metrics**: Track performance analytics and community engagement
- **Portfolio Dashboard**: Comprehensive startup management interface

### For Investors
- **Direct Investment**: Purchase startup tokens directly with ALGO
- **Portfolio Tracking**: Monitor your investment performance in real-time
- **Secondary Trading**: Trade tokens on integrated DEX functionality
- **Due Diligence Tools**: Access transparent metrics and verified data

### For Community
- **Competition Voting**: Participate in startup competitions and governance
- **Leaderboard System**: Track top-performing startups across various metrics
- **Social Features**: Follow startups and engage with the ecosystem

## 🏗️ Architecture

### Smart Contracts (Algokit)
- **Startup Registry**: Core registration and profile management
- **Competition System**: Tournament-style competitions with prize pools
- **Tokenization Factory**: ASA creation and management
- **Scoring Engine**: Automated metrics calculation

### Frontend (React + TypeScript)
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Wallet Integration**: Support for Pera, Defly, and Daffi wallets
- **Real-time Updates**: Live data synchronization with blockchain
- **Responsive Design**: Mobile-first approach with dark mode support

### Backend Services
- **Algorand Integration**: Full blockchain interaction via AlgoKit
- **Firebase Sync**: Off-chain data storage and real-time updates
- **GitHub API**: Automated repository metrics collection
- **Social Media Tracking**: Twitter/X engagement monitoring

## 🛠️ Technology Stack

- **Blockchain**: Algorand (TestNet/MainNet)
- **Smart Contracts**: PyTeal (Python → TEAL)
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Wallet Connectivity**: @txnlab/use-wallet-react
- **State Management**: React Context + Hooks
- **Backend**: Firebase (Firestore, Analytics)
- **Development**: AlgoKit, ESLint, Prettier

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- AlgoKit CLI 2.0.0+
- Git

### Installation

1. **Clone the repository**
```bash
algokit project bootstrap all
## 2. Bootstrap the project

```bash
algokit project bootstrap all
```

## 3. Install frontend dependencies

```bash
cd projects/startex-frontend
npm install
```

## 4. Environment Configuration

Copy `.env.template` to `.env.localnet` and configure:

```env
VITE_ALGOD_NETWORK=localnet
VITE_ALGOD_SERVER=http://localhost
VITE_ALGOD_PORT=4001
VITE_ALGOD_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

VITE_INDEXER_SERVER=http://localhost
VITE_INDEXER_PORT=8980
VITE_INDEXER_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

## 5. Deploy Smart Contracts

```bash
algokit project run build
algokit project deploy localnet
```

## 6. Start Frontend

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to access the application.


## 📱 Usage Guide

### For Startup Founders
1. **Connect Wallet:** Use Pera, Defly, or Daffi wallet  
2. **Register Startup:** Provide basic information and GitHub repository  
3. **Configure Token:** Set ASA parameters (name, symbol, supply, decimals)  
4. **Launch:** Deploy on Algorand with automatic tokenization  
5. **Manage:** Track metrics, update information, and engage community  

### For Investors
1. **Browse Startups:** Explore tokenized startups on the platform  
2. **Analyze Metrics:** Review GitHub activity, social media growth, and performance  
3. **Invest:** Purchase startup tokens directly with ALGO  
4. **Track Portfolio:** Monitor your investments and returns  
5. **Trade:** Use integrated trading features for secondary market  

### For Community Members
1. **Discover:** Find promising startups through leaderboards  
2. **Compete:** Vote in competitions and earn rewards  
3. **Support:** Donate to competition prize pools  
4. **Engage:** Follow startups and track their progress  

## 🏆 Competition System

### How Competitions Work
- **Monthly Themes:** Different focus areas (Growth, Innovation, Demo Day)  
- **Scoring Metrics:** GitHub activity (40%), Community growth (25%), Token performance (20%), Competition success (15%)  
- **Prize Distribution:** ALGO rewards for top 3 positions  
- **Fair Judging:** Transparent, automated scoring with community input  


## 🔐 Security

- **Smart Contract Auditing:** All contracts follow Algorand best practices  
- **Wallet Security:** No private keys stored, wallet-only signing  
- **Data Validation:** Comprehensive input validation and sanitization  
- **Rate Limiting:** API rate limits to prevent abuse  
- **HTTPS Everywhere:** All communications encrypted  

## 🌐 Network Configuration

### Supported Networks
- **LocalNet:** Development and testing  
- **TestNet:** Public testing environment  
- **MainNet:** Production deployment  

### Wallet Support
- **Pera Wallet:** Mobile and web support  
- **Defly Wallet:** Advanced DeFi features  
- **Daffi Wallet:** Community-focused wallet  
- **WalletConnect:** Universal wallet connectivity  

## 📊 Metrics & Analytics

### Startup Metrics
- **GitHub:** Commits, stars, forks, contributors  
- **Social Media:** Twitter followers, engagement rate  
- **Platform:** Posts, views, community interaction  
- **Token:** Price, holders, trading volume  

### Competition Scoring
Transparent scoring algorithm with weighted factors:  
- **Development Activity:** 40%  
- **Community Growth:** 25%  
- **Token Performance:** 20%  
- **Competition Success:** 15%  

## 🤝 Contributing

We welcome contributions! Please see our Contributing Guide for details.  

### Development Process
1. Fork the repository  
2. Create a feature branch  
3. Make your changes  
4. Write tests  
5. Submit a pull request  

### Code Standards
- **TypeScript** for all frontend code  
- **PyTeal** for smart contracts  
- **ESLint + Prettier** for formatting  
- Comprehensive testing required  

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.   

## 🎯 Roadmap

### Q3 2025
- Core platform launch  
- Basic tokenization features  
- Advanced trading features  
- Mobile app beta  

### Q4 2025
- Cross-chain integration  
- Advanced analytics dashboard  
- Institutional investor tools  
- API marketplace  

### Q1 2026
- DAO governance  
- Yield farming features  
- NFT integration  
- Global expansion  

## 🏅 Acknowledgments
- **Algorand Foundation** for blockchain infrastructure  
- **AlgoKit Team** for development tools  
- **Open Source Community** for libraries and frameworks  
- **Early Adopters** for feedback and testing  




