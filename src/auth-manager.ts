import { TwitterApi } from 'twitter-api-v2';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export interface OAuth2Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class OAuth2AuthManager {
  private config: OAuth2Config;
  private tokensPath: string;
  
  constructor() {
    this.config = this.getConfig();
    this.tokensPath = this.getTokensPath();
  }
  
  private getTokensPath(): string {
    // Check for custom tokens path from environment variable
    const customPath = process.env.X_TOKENS_PATH;
    if (customPath) {
      return customPath;
    }
    
    // Get the project directory from the current module's location
    const currentDir = path.dirname(new URL(import.meta.url).pathname);
    const projectDir = path.resolve(currentDir, '..');
    
    return path.join(projectDir, '.tokens.json');
  }

  private getConfig(): OAuth2Config {
    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;
    const redirectUri = process.env.X_REDIRECT_URI || 'http://localhost:3000/callback';
    
    if (!clientId || !clientSecret) {
      throw new Error('OAuth 2.0 credentials not found. Please set X_CLIENT_ID and X_CLIENT_SECRET in environment variables.');
    }
    
    return { clientId, clientSecret, redirectUri };
  }
  
  generateAuthLink(): { url: string; codeVerifier: string; state: string } {
    const client = new TwitterApi({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
    });
    
    const scopes = [
      'tweet.read',
      'users.read', 
      'bookmark.read',
      'bookmark.write',
      'like.read',
      'like.write',
      'list.read',
      'list.write',
      'offline.access'
    ];
    
    return client.generateOAuth2AuthLink(this.config.redirectUri, { scope: scopes });
  }
  
  async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<OAuth2Tokens> {
    const client = new TwitterApi({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
    });
    
    try {
      const { accessToken, refreshToken } = await client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: this.config.redirectUri,
      });
      
      const tokens: OAuth2Tokens = {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + (7200 * 1000) // Assuming 2 hour expiry
      };
      
      await this.saveTokens(tokens);
      return tokens;
    } catch (error) {
      throw new Error(`Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async refreshTokens(refreshToken: string): Promise<OAuth2Tokens> {
    const client = new TwitterApi({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
    });
    
    try {
      const { accessToken, refreshToken: newRefreshToken } = await client.refreshOAuth2Token(refreshToken);
      
      const tokens: OAuth2Tokens = {
        accessToken,
        refreshToken: newRefreshToken || refreshToken,
        expiresAt: Date.now() + (7200 * 1000)
      };
      
      await this.saveTokens(tokens);
      return tokens;
    } catch (error) {
      throw new Error(`Failed to refresh tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getValidTokens(): Promise<OAuth2Tokens | null> {
    try {
      const tokens = await this.loadTokens();
      
      if (!tokens) {
        return null;
      }
      
      // Check if token needs refresh
      if (tokens.expiresAt && tokens.expiresAt < Date.now() + (5 * 60 * 1000)) { // 5 min buffer
        if (tokens.refreshToken) {
          console.error('Access token expiring soon, refreshing...');
          return await this.refreshTokens(tokens.refreshToken);
        } else {
          console.error('Access token expired and no refresh token available');
          return null;
        }
      }
      
      return tokens;
    } catch (error) {
      console.error('Failed to get valid tokens:', error);
      return null;
    }
  }
  
  async saveTokens(tokens: OAuth2Tokens): Promise<void> {
    try {
      await fs.writeFile(this.tokensPath, JSON.stringify(tokens, null, 2));
      console.error('Tokens saved successfully');
    } catch (error) {
      throw new Error(`Failed to save tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async loadTokens(): Promise<OAuth2Tokens | null> {
    try {
      if (!existsSync(this.tokensPath)) {
        return null;
      }
      
      const tokensData = await fs.readFile(this.tokensPath, 'utf-8');
      return JSON.parse(tokensData);
    } catch (error) {
      console.error('Failed to load tokens:', error);
      return null;
    }
  }
  
  async clearTokens(): Promise<void> {
    try {
      if (existsSync(this.tokensPath)) {
        await fs.unlink(this.tokensPath);
        console.error('Tokens cleared');
      }
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }
  
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getValidTokens();
    return tokens !== null;
  }
  
  async getAuthenticatedClient(): Promise<TwitterApi | null> {
    const tokens = await this.getValidTokens();
    
    if (!tokens) {
      return null;
    }
    
    return new TwitterApi(tokens.accessToken);
  }
}