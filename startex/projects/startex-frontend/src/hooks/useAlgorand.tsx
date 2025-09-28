// frontend/src/hooks/useAlgorand.tsx

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import AlgorandService, { StartupData, TokenData } from '../services/algorand/client';

// Context Type
interface AlgorandContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  
  // Wallet methods
  connect: (walletType: 'pera' | 'defly' | 'daffi') => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Registry methods
  registerStartup: (params: {
    name: string;
    description: string;
    githubRepo: string;
    website?: string;
    twitter?: string;
  }) => Promise<{ startupId: number; txId: string }>;

  getStartup: (startupId: number) => Promise<StartupData | null>;

  // Token methods
  tokenizeStartup: (params: {
    startupId: number;
    tokenName: string;
    tokenSymbol: string;
    totalSupply: number;
    decimals: number;
  }) => Promise<{ assetId: number; txId: string }>;
  
  transferTokens: (params: {
    startupId: number;
    to: string;
    amount: number;
  }) => Promise<string>;
  
  getTokenInfo: (startupId: number) => Promise<TokenData | null>;
  
  getBalance: (address: string, assetId: number) => Promise<number>;
  
  // Competition methods
  joinCompetition: (competitionId: number, startupId: number) => Promise<string>;
  
  // Scoring methods
  updateMetrics: (params: {
    startupId: number;
    commits: number;
    stars: number;
    forks: number;
  }) => Promise<string>;
}

// Context
const AlgorandContext = createContext<AlgorandContextType | undefined>(undefined);

// Provider Component
export function AlgorandProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  
  const algorand = AlgorandService.getInstance();
  
  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await algorand.reconnectWallet();
        const addr = algorand.getCurrentAddress();
        if (addr) {
          setAddress(addr);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Failed to reconnect wallet:', error);
      }
    };
    
    checkConnection();
  }, []);
  
  // Connect wallet
  const connect = useCallback(async (walletType: 'pera' | 'defly' | 'daffi') => {
    setIsConnecting(true);
    try {
      const accounts = await algorand.connectWallet(walletType);
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);
  
  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      await algorand.disconnectWallet();
      setAddress(null);
      setIsConnected(false);
    } catch (error) {
      console.error('Disconnection failed:', error);
    }
  }, []);
  
  // Register startup
  const registerStartup = useCallback(async (params: Parameters<typeof algorand.registerStartup>[0]) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    return algorand.registerStartup(params);
  }, [isConnected]);
  
  // Get startup
  const getStartup = useCallback(async (startupId: number) => {
    return algorand.getStartup(startupId);
  }, []);
  
  // Tokenize startup
  const tokenizeStartup = useCallback(async (params: Parameters<typeof algorand.tokenizeStartup>[0]) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    return algorand.tokenizeStartup(params);
  }, [isConnected]);
  
  // Transfer tokens
  const transferTokens = useCallback(async (params: Parameters<typeof algorand.transferTokens>[0]) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    return algorand.transferTokens(params);
  }, [isConnected]);
  
  // Get token info
  const getTokenInfo = useCallback(async (startupId: number) => {
    return algorand.getTokenInfo(startupId);
  }, []);
  
  // Get balance
  const getBalance = useCallback(async (address: string, assetId: number) => {
    return algorand.getAssetBalance(address, assetId);
  }, []);
  
  // Join competition
  const joinCompetition = useCallback(async (competitionId: number, startupId: number) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    return algorand.joinCompetition(competitionId, startupId);
  }, [isConnected]);
  
  // Update metrics
  const updateMetrics = useCallback(async (params: Parameters<typeof algorand.updateGithubMetrics>[0]) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    return algorand.updateGithubMetrics(params);
  }, [isConnected]);
  
  const value: AlgorandContextType = {
    isConnected,
    isConnecting,
    address,
    connect,
    disconnect,
    registerStartup,
    getStartup,
    tokenizeStartup,
    transferTokens,
    getTokenInfo,
    getBalance,
    joinCompetition,
    updateMetrics,
  };
  
  return (
    <AlgorandContext.Provider value={value}>
      {children}
    </AlgorandContext.Provider>
  );
}

// Hook
export function useAlgorand() {
  const context = useContext(AlgorandContext);
  if (context === undefined) {
    throw new Error('useAlgorand must be used within AlgorandProvider');
  }
  return context;
}

// Specific hooks for common use cases
export function useWallet() {
  const { isConnected, isConnecting, address, connect, disconnect } = useAlgorand();
  return { isConnected, isConnecting, address, connect, disconnect };
}

export function useStartup(startupId: number | null) {
  const [startup, setStartup] = useState<StartupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { getStartup } = useAlgorand();
  
  useEffect(() => {
    if (startupId === null) {
      setStartup(null);
      return;
    }
    
    const fetchStartup = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getStartup(startupId);
        setStartup(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStartup();
  }, [startupId, getStartup]);
  
  return { startup, loading, error };
}

export function useToken(startupId: number | null) {
  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { getTokenInfo } = useAlgorand();
  
  useEffect(() => {
    if (startupId === null) {
      setToken(null);
      return;
    }
    
    const fetchToken = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getTokenInfo(startupId);
        setToken(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchToken();
  }, [startupId, getTokenInfo]);
  
  return { token, loading, error };
}

export function useBalance(address: string | null, assetId: number | null) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { getBalance } = useAlgorand();
  
  useEffect(() => {
    if (!address || assetId === null) {
      setBalance(0);
      return;
    }
    
    const fetchBalance = async () => {
      setLoading(true);
      setError(null);
      try {
        const bal = await getBalance(address, assetId);
        setBalance(bal);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBalance();
    
    // Poll for balance updates
    const interval = setInterval(fetchBalance, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, [address, assetId, getBalance]);
  
  return { balance, loading, error };
}
