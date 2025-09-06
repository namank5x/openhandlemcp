#!/usr/bin/env node

import { OAuth2AuthManager } from './auth-manager.js';
import { TwitterClient } from './twitter-client.js';
import { createServer } from 'http';
import { parse } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class OAuthSetup {
  private authManager: OAuth2AuthManager;
  private codeVerifier: string = '';
  private state: string = '';
  
  constructor() {
    try {
      this.authManager = new OAuth2AuthManager();
    } catch (error) {
      console.error('Failed to initialize OAuth manager:', error);
      process.exit(1);
    }
  }
  
  async setup(): Promise<void> {
    console.log('🚀 X Profile MCP Server - OAuth 2.0 Setup');
    console.log('=========================================\n');
    
    try {
      // Check if already authenticated
      const isAuthenticated = await this.authManager.isAuthenticated();
      if (isAuthenticated) {
        console.log('✅ You are already authenticated!');
        
        // Test the authentication
        await this.testAuthentication();
        return;
      }
      
      console.log('📋 This setup will:\n');
      console.log('   1. Generate an OAuth 2.0 authorization URL');
      console.log('   2. Open your web browser');
      console.log('   3. Redirect to a local callback server');
      console.log('   4. Exchange the authorization code for access tokens');
      console.log('   5. Save tokens for future use\n');
      
      // Generate auth link
      console.log('🔗 Generating authorization link...');
      const { url, codeVerifier, state } = this.authManager.generateAuthLink();
      this.codeVerifier = codeVerifier;
      this.state = state;
      
      console.log(`\n🌐 Authorization URL: ${url}\n`);
      
      // Start local callback server
      const server = await this.startCallbackServer();
      
      // Open browser
      console.log('🚀 Opening browser...');
      await this.openBrowser(url);
      
      console.log('⏳ Waiting for authorization...\n');
      console.log('Please complete the authorization in your browser.');
      console.log('If the browser doesn\'t open automatically, copy and paste the URL above.\n');
      
    } catch (error) {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    }
  }
  
  private async startCallbackServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = createServer(async (req, res) => {
        try {
          const parsedUrl = parse(req.url || '', true);
          
          if (parsedUrl.pathname === '/callback') {
            const { code, state, error } = parsedUrl.query;
            
            if (error) {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body>
                    <h1>❌ Authorization Failed</h1>
                    <p>Error: ${error}</p>
                    <p>Please check your setup and try again.</p>
                  </body>
                </html>
              `);
              server.close();
              reject(new Error(`Authorization failed: ${error}`));
              return;
            }
            
            if (!code || !state || state !== this.state) {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body>
                    <h1>❌ Invalid Request</h1>
                    <p>Missing or invalid authorization parameters.</p>
                  </body>
                </html>
              `);
              server.close();
              reject(new Error('Invalid authorization parameters'));
              return;
            }
            
            try {
              console.log('\n🔄 Exchanging authorization code for tokens...');
              const tokens = await this.authManager.exchangeCodeForTokens(code as string, this.codeVerifier);
              
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body>
                    <h1>✅ Authorization Successful!</h1>
                    <p>You have been successfully authenticated with X/Twitter.</p>
                    <p>You can now close this window and return to your terminal.</p>
                    <p>Personal tools are now available in the MCP server.</p>
                  </body>
                </html>
              `);
              
              server.close();
              
              console.log('✅ Authentication successful!');
              console.log('💾 Tokens saved successfully');
              
              // Test the authentication
              await this.testAuthentication();
              
              resolve();
            } catch (authError) {
              res.writeHead(500, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body>
                    <h1>❌ Token Exchange Failed</h1>
                    <p>Error: ${authError instanceof Error ? authError.message : 'Unknown error'}</p>
                  </body>
                </html>
              `);
              server.close();
              reject(authError);
            }
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
          }
        } catch (error) {
          server.close();
          reject(error);
        }
      });
      
      server.listen(3000, 'localhost', () => {
        console.log('🔄 Callback server started on http://localhost:3000');
        resolve();
      });
      
      server.on('error', (error) => {
        reject(error);
      });
      
      // Timeout after 5 minutes
      setTimeout(() => {
        server.close();
        reject(new Error('Authorization timeout - please try again'));
      }, 5 * 60 * 1000);
    });
  }
  
  private async openBrowser(url: string): Promise<void> {
    try {
      const platform = process.platform;
      let command: string;
      
      switch (platform) {
        case 'darwin':
          command = `open "${url}"`;
          break;
        case 'win32':
          command = `start "" "${url}"`;
          break;
        default:
          command = `xdg-open "${url}"`;
      }
      
      await execAsync(command);
    } catch (error) {
      console.warn('⚠️  Failed to open browser automatically. Please copy and paste the URL above.');
    }
  }
  
  private async testAuthentication(): Promise<void> {
    try {
      console.log('\n🧪 Testing authentication...');
      
      const twitterClient = new TwitterClient();
      const isAvailable = await twitterClient.isAuthenticationAvailable();
      
      if (!isAvailable) {
        throw new Error('Authentication not available');
      }
      
      const profile = await twitterClient.getMyProfile();
      
      console.log('✅ Authentication test successful!');
      console.log(`👋 Hello, @${profile.username} (${profile.name})`);
      console.log(`📊 Followers: ${profile.public_metrics?.followers_count?.toLocaleString() || 'N/A'}`);
      
      console.log('\n🎉 Setup complete! You can now use personal tools in the MCP server:');
      console.log('   • get_my_profile - Get your profile information');
      console.log('   • get_my_bookmarks - Fetch your bookmarks');
      console.log('   • manage_bookmark - Add/remove bookmarks');
      console.log('   • get_my_likes - Fetch your liked tweets');
      console.log('   • manage_like - Like/unlike tweets');
      console.log('   • get_my_timeline - Get your home timeline');
      
    } catch (error) {
      console.warn('⚠️  Authentication saved but testing failed:', error);
      console.log('You may still be able to use the personal tools once the MCP server is running.');
    }
  }
  
  async reset(): Promise<void> {
    console.log('🔄 Resetting authentication...');
    await this.authManager.clearTokens();
    console.log('✅ Authentication cleared. Run setup again to re-authenticate.');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const setup = new OAuthSetup();
  
  if (args.includes('--reset') || args.includes('-r')) {
    await setup.reset();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('X Profile MCP Server - OAuth 2.0 Setup\n');
    console.log('Usage:');
    console.log('  setup-auth           Set up OAuth 2.0 authentication');
    console.log('  setup-auth --reset   Clear existing authentication');
    console.log('  setup-auth --help    Show this help message');
  } else {
    await setup.setup();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}