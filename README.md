# StartEx - Startup Tokenization Platform

A revolutionary platform bridging traditional startup funding and DeFi, built on Algorand blockchain. Convert your startup into tradeable Algorand Standard Assets (ASA) and compete for funding in community-driven competitions.

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

### Smart Contracts (PyTeal)
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

