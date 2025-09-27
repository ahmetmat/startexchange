// frontend/src/services/algorand/client.ts

import algosdk from 'algosdk';
import { DeflyWalletConnect } from '@blockshake/defly-connect';
import { PeraWalletConnect } from '@perawallet/connect';

// Types
export interface AlgorandConfig {
  network: 'testnet' | 'mainnet' | 'localnet';
  algodToken: string;
  algodServer: string;
  algodPort: number;
  indexerToken: string;
  indexerServer: string;
  indexerPort: number;
}

export interface StartupData {
  id: number;
  owner: string;
  name: string;
  description: string;
  githubRepo: string;
  website?: string;
  twitter?: string;
  tokenAssetId?: number;
  createdAt: number;
  isVerified: boolean;
  totalScore: number;
}

export interface TokenData {
  assetId: number;
  startupId: number;
  creator: string;
  name: string;
  symbol: string;
  totalSupply: bigint;
  decimals: number;
  createdAt: number;
}

// Configuration
const getConfig = (): AlgorandConfig => {
  const network = (process.env.NEXT_PUBLIC_NETWORK || 'testnet') as AlgorandConfig['network'];
  
  const configs: Record<AlgorandConfig['network'], AlgorandConfig> = {
    testnet: {
      network: 'testnet',
      algodToken: '',
      algodServer: 'https://testnet-api.algonode.cloud',
      algodPort: 443,
      indexerToken: '',
      indexerServer: 'https://testnet-idx.algonode.cloud',
      indexerPort: 443,
    },
    mainnet: {
      network: 'mainnet',
      algodToken: '',
      algodServer: 'https://mainnet-api.algonode.cloud',
      algodPort: 443,
      indexerToken: '',
      indexerServer: 'https://mainnet-idx.algonode.cloud',
      indexerPort: 443,
    },
    localnet: {
      network: 'localnet',
      algodToken: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      algodServer: 'http://localhost',
      algodPort: 4001,
      indexerToken: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      indexerServer: 'http://localhost',
      indexerPort: 8980,
    },
  };
  
  return configs[network];
};

// Algorand Client Service
export class AlgorandService {
  private static instance: AlgorandService;
  private algodClient: algosdk.Algodv2;
  private indexerClient: algosdk.Indexer;
  private config: AlgorandConfig;
  
  // Wallet connections
  private peraWallet: PeraWalletConnect;
  private deflyWallet: DeflyWalletConnect;
  private daffiWallet: DaffiWalletConnect;
  
  // Current wallet state
  private currentWallet: 'pera' | 'defly' | 'daffi' | null = null;
  private currentAddress: string | null = null;
  
  // App IDs
  private registryAppId: number;
  private tokenFactoryAppId: number;
  private scoringAppId: number;
  private competitionAppId: number;
  
  private constructor() {
    this.config = getConfig();
    
    // Initialize Algod client
    this.algodClient = new algosdk.Algodv2(
      this.config.algodToken,
      this.config.algodServer,
      this.config.algodPort
    );
    
    // Initialize Indexer client
    this.indexerClient = new algosdk.Indexer(
      this.config.indexerToken,
      this.config.indexerServer,
      this.config.indexerPort
    );
    
    // Initialize wallets
    this.peraWallet = new PeraWalletConnect();
    this.deflyWallet = new DeflyWalletConnect();
    
    // Load app IDs from environment
    this.registryAppId = parseInt(process.env.NEXT_PUBLIC_APP_ID_REGISTRY || '0');
    this.tokenFactoryAppId = parseInt(process.env.NEXT_PUBLIC_APP_ID_TOKEN_FACTORY || '0');
    this.scoringAppId = parseInt(process.env.NEXT_PUBLIC_APP_ID_SCORING || '0');
    this.competitionAppId = parseInt(process.env.NEXT_PUBLIC_APP_ID_COMPETITION || '0');
  }
  
  static getInstance(): AlgorandService {
    if (!AlgorandService.instance) {
      AlgorandService.instance = new AlgorandService();
    }
    return AlgorandService.instance;
  }
  
  // Wallet Connection Methods
  async connectWallet(walletType: 'pera' | 'defly' | 'daffi'): Promise<string[]> {
    try {
      let accounts: string[] = [];
      
      switch (walletType) {
        case 'pera':
          accounts = await this.peraWallet.connect();
          this.currentWallet = 'pera';
          break;
        case 'defly':
          accounts = await this.deflyWallet.connect();
          this.currentWallet = 'defly';
          break;
        case 'daffi':
          accounts = await this.daffiWallet.connect();
          this.currentWallet = 'daffi';
          break;
      }
      
      if (accounts.length > 0) {
        this.currentAddress = accounts[0];
        localStorage.setItem('algorandWallet', walletType);
        localStorage.setItem('algorandAddress', accounts[0]);
      }
      
      return accounts;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }
  
  async disconnectWallet(): Promise<void> {
    try {
      switch (this.currentWallet) {
        case 'pera':
          await this.peraWallet.disconnect();
          break;
        case 'defly':
          await this.deflyWallet.disconnect();
          break;
        case 'daffi':
          await this.daffiWallet.disconnect();
          break;
      }
      
      this.currentWallet = null;
      this.currentAddress = null;
      localStorage.removeItem('algorandWallet');
      localStorage.removeItem('algorandAddress');
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
    }
  }
  
  async reconnectWallet(): Promise<void> {
    const walletType = localStorage.getItem('algorandWallet') as 'pera' | 'defly' | 'daffi';
    if (walletType) {
      await this.connectWallet(walletType);
    }
  }
  
  getCurrentAddress(): string | null {
    return this.currentAddress;
  }
  
  // Registry Contract Methods
  async registerStartup(params: {
    name: string;
    description: string;
    githubRepo: string;
    website?: string;
    twitter?: string;
  }): Promise<number> {
    if (!this.currentAddress) {
      throw new Error('Wallet not connected');
    }
    
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    
    // Create application call transaction
    const appArgs = [
      new Uint8Array(Buffer.from('register_startup')),
      new Uint8Array(Buffer.from(params.name)),
      new Uint8Array(Buffer.from(params.description)),
      new Uint8Array(Buffer.from(params.githubRepo)),
      new Uint8Array(Buffer.from(params.website || '')),
      new Uint8Array(Buffer.from(params.twitter || '')),
    ];
    
    const txn = algosdk.makeApplicationCallTxnFromObject({
      from: this.currentAddress,
      appIndex: this.registryAppId,
      appArgs,
      suggestedParams,
    });
    
    // Sign and send transaction
    const signedTxn = await this.signTransaction(txn);
    const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    const result = await algosdk.waitForConfirmation(this.algodClient, txId, 4);
    
    // Extract startup ID from logs
    const startupId = this.extractStartupIdFromLogs(result);
    
    return startupId;
  }
  
  async getStartup(startupId: number): Promise<StartupData | null> {
    try {
      const appInfo = await this.algodClient.getApplicationByID(this.registryAppId).do();
      
      // Read from box storage
      const boxName = Buffer.concat([
        Buffer.from('startup_'),
        algosdk.bigIntToBytes(BigInt(startupId), 8)
      ]);
      
      const box = await this.algodClient.getApplicationBoxByName(this.registryAppId, boxName).do();
      
      // Decode startup data
      const startupData = this.decodeStartupData(box.value);
      
      return startupData;
    } catch (error) {
      console.error('Failed to get startup:', error);
      return null;
    }
  }
  
  // Token Factory Methods
  async tokenizeStartup(params: {
    startupId: number;
    tokenName: string;
    tokenSymbol: string;
    totalSupply: number;
    decimals: number;
  }): Promise<number> {
    if (!this.currentAddress) {
      throw new Error('Wallet not connected');
    }
    
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    
    // Create payment transaction for tokenization fee (1 ALGO)
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: this.currentAddress,
      to: await this.getTokenFactoryAddress(),
      amount: 1000000, // 1 ALGO in microAlgos
      suggestedParams,
    });
    
    // Create application call transaction
    const appArgs = [
      new Uint8Array(Buffer.from('tokenize_startup')),
      algosdk.bigIntToBytes(BigInt(params.startupId), 8),
      new Uint8Array(Buffer.from(params.tokenName)),
      new Uint8Array(Buffer.from(params.tokenSymbol)),
      algosdk.bigIntToBytes(BigInt(params.totalSupply), 8),
      algosdk.bigIntToBytes(BigInt(params.decimals), 8),
    ];
    
    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      from: this.currentAddress,
      appIndex: this.tokenFactoryAppId,
      appArgs,
      suggestedParams,
    });
    
    // Group transactions
    const groupedTxns = algosdk.assignGroupID([paymentTxn, appCallTxn]);
    
    // Sign transactions
    const signedTxns = await this.signTransactions(groupedTxns);
    
    // Send grouped transactions
    const { txId } = await this.algodClient.sendRawTransaction(signedTxns).do();
    
    // Wait for confirmation
    const result = await algosdk.waitForConfirmation(this.algodClient, txId, 4);
    
    // Extract asset ID from result
    const assetId = this.extractAssetIdFromResult(result);
    
    return assetId;
  }
  
  async transferTokens(params: {
    startupId: number;
    to: string;
    amount: number;
  }): Promise<string> {
    if (!this.currentAddress) {
      throw new Error('Wallet not connected');
    }
    
    // Get token info first
    const tokenInfo = await this.getTokenInfo(params.startupId);
    if (!tokenInfo) {
      throw new Error('Token not found');
    }
    
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    
    // Create asset transfer transaction
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: this.currentAddress,
      to: params.to,
      amount: params.amount,
      assetIndex: tokenInfo.assetId,
      suggestedParams,
    });
    
    // Sign and send transaction
    const signedTxn = await this.signTransaction(txn);
    const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(this.algodClient, txId, 4);
    
    return txId;
  }
  
  async getTokenInfo(startupId: number): Promise<TokenData | null> {
    try {
      // Read from box storage
      const boxName = Buffer.concat([
        Buffer.from('token_'),
        algosdk.bigIntToBytes(BigInt(startupId), 8)
      ]);
      
      const box = await this.algodClient.getApplicationBoxByName(this.tokenFactoryAppId, boxName).do();
      
      // Decode token data
      const tokenData = this.decodeTokenData(box.value);
      
      return tokenData;
    } catch (error) {
      console.error('Failed to get token info:', error);
      return null;
    }
  }
  
  async getAssetBalance(address: string, assetId: number): Promise<number> {
    try {
      const accountInfo = await this.algodClient.accountInformation(address).do();
      
      const asset = accountInfo['assets'].find((a: any) => a['asset-id'] === assetId);
      
      return asset ? asset.amount : 0;
    } catch (error) {
      console.error('Failed to get asset balance:', error);
      return 0;
    }
  }
  
  // Competition Methods
  async joinCompetition(competitionId: number, startupId: number): Promise<string> {
    if (!this.currentAddress) {
      throw new Error('Wallet not connected');
    }
    
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    
    const appArgs = [
      new Uint8Array(Buffer.from('join_competition')),
      algosdk.bigIntToBytes(BigInt(competitionId), 8),
      algosdk.bigIntToBytes(BigInt(startupId), 8),
    ];
    
    const txn = algosdk.makeApplicationCallTxnFromObject({
      from: this.currentAddress,
      appIndex: this.competitionAppId,
      appArgs,
      suggestedParams,
    });
    
    const signedTxn = await this.signTransaction(txn);
    const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();
    
    await algosdk.waitForConfirmation(this.algodClient, txId, 4);
    
    return txId;
  }
  
  // Scoring Methods
  async updateGithubMetrics(params: {
    startupId: number;
    commits: number;
    stars: number;
    forks: number;
  }): Promise<string> {
    if (!this.currentAddress) {
      throw new Error('Wallet not connected');
    }
    
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    
    const appArgs = [
      new Uint8Array(Buffer.from('update_github_metrics')),
      algosdk.bigIntToBytes(BigInt(params.startupId), 8),
      algosdk.bigIntToBytes(BigInt(params.commits), 8),
      algosdk.bigIntToBytes(BigInt(params.stars), 8),
      algosdk.bigIntToBytes(BigInt(params.forks), 8),
    ];
    
    const txn = algosdk.makeApplicationCallTxnFromObject({
      from: this.currentAddress,
      appIndex: this.scoringAppId,
      appArgs,
      suggestedParams,
    });
    
    const signedTxn = await this.signTransaction(txn);
    const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();
    
    await algosdk.waitForConfirmation(this.algodClient, txId, 4);
    
    return txId;
  }
  
  // Helper Methods
  private async signTransaction(txn: algosdk.Transaction): Promise<Uint8Array> {
    const txnB64 = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64');
    
    let signedTxns: string[] = [];
    
    switch (this.currentWallet) {
      case 'pera':
        signedTxns = await this.peraWallet.signTransaction([[{ txn: txnB64 }]]);
        break;
      case 'defly':
        signedTxns = await this.deflyWallet.signTransaction([[{ txn: txnB64 }]]);
        break;
      case 'daffi':
        signedTxns = await this.daffiWallet.signTransaction([[{ txn: txnB64 }]]);
        break;
      default:
        throw new Error('No wallet connected');
    }
    
    return new Uint8Array(Buffer.from(signedTxns[0], 'base64'));
  }
  
  private async signTransactions(txns: algosdk.Transaction[]): Promise<Uint8Array[]> {
    const txnGroup = txns.map(txn => ({
      txn: Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64')
    }));
    
    let signedTxns: string[] = [];
    
    switch (this.currentWallet) {
      case 'pera':
        signedTxns = await this.peraWallet.signTransaction([txnGroup]);
        break;
      case 'defly':
        signedTxns = await this.deflyWallet.signTransaction([txnGroup]);
        break;
      case 'daffi':
        signedTxns = await this.daffiWallet.signTransaction([txnGroup]);
        break;
      default:
        throw new Error('No wallet connected');
    }
    
    return signedTxns.map(txn => new Uint8Array(Buffer.from(txn, 'base64')));
  }
  
  private async getTokenFactoryAddress(): Promise<string> {
    const appInfo = await this.algodClient.getApplicationByID(this.tokenFactoryAppId).do();
    return algosdk.getApplicationAddress(this.tokenFactoryAppId);
  }
  
  private extractStartupIdFromLogs(result: any): number {
    // Parse logs to extract startup ID
    // Implementation depends on how we log in the contract
    return 1; // Placeholder
  }
  
  private extractAssetIdFromResult(result: any): number {
    // Extract created asset ID from transaction result
    if (result['inner-txns']) {
      for (const innerTxn of result['inner-txns']) {
        if (innerTxn['asset-index']) {
          return innerTxn['asset-index'];
        }
      }
    }
    return 0;
  }
  
  private decodeStartupData(bytes: Uint8Array): StartupData {
    // Decode ABI-encoded startup data
    // Implementation depends on exact encoding
    return {} as StartupData; // Placeholder
  }
  
  private decodeTokenData(bytes: Uint8Array): TokenData {
    // Decode ABI-encoded token data
    // Implementation depends on exact encoding
    return {} as TokenData; // Placeholder
  }
}

export default AlgorandService;