#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { XTools } from './tools.js';

class XProfileMCPServer {
  private server: Server;
  private tools: XTools;
  
  constructor() {
    this.server = new Server(
      {
        name: 'x-profile-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    try {
      this.tools = new XTools();
      console.error('X Profile MCP Server initialized successfully');
    } catch (error) {
      console.error('Failed to initialize X Profile MCP Server:', error);
      console.error('Please ensure OAuth 2.0 credentials are configured and run "pnpm run setup-auth" to authenticate.');
      process.exit(1);
    }
    
    this.setupToolHandlers();
    this.setupErrorHandling();
  }
  
  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = [
          {
            name: 'get_user_profile',
            description: 'Fetch X/Twitter user profile information including bio, follower count, and verification status',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'X/Twitter username (without @ symbol)',
                },
              },
              required: ['username'],
            },
          },
          {
            name: 'get_user_timeline',
            description: 'Fetch recent tweets from a user\'s timeline',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'X/Twitter username (without @ symbol)',
                },
                limit: {
                  type: 'number',
                  description: 'Number of tweets to fetch (1-100)',
                  minimum: 1,
                  maximum: 100,
                  default: 10,
                },
              },
              required: ['username'],
            },
          },
          {
            name: 'search_tweets',
            description: 'Search for tweets by keywords, hashtags, or phrases',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (keywords, hashtags, etc.)',
                },
                limit: {
                  type: 'number',
                  description: 'Number of tweets to fetch (1-100)',
                  minimum: 1,
                  maximum: 100,
                  default: 10,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_user_followers',
            description: 'Fetch a list of users following the specified account',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'X/Twitter username (without @ symbol)',
                },
                limit: {
                  type: 'number',
                  description: 'Number of followers to fetch (1-1000)',
                  minimum: 1,
                  maximum: 1000,
                  default: 10,
                },
              },
              required: ['username'],
            },
          },
          {
            name: 'get_user_following',
            description: 'Fetch a list of users that the specified account follows',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'X/Twitter username (without @ symbol)',
                },
                limit: {
                  type: 'number',
                  description: 'Number of following accounts to fetch (1-1000)',
                  minimum: 1,
                  maximum: 1000,
                  default: 10,
                },
              },
              required: ['username'],
            },
          },
          {
            name: 'get_my_profile',
            description: 'Get your authenticated X/Twitter profile information',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'get_my_bookmarks',
            description: 'Fetch your bookmarked tweets',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Number of bookmarks to fetch (1-100)',
                  minimum: 1,
                  maximum: 100,
                  default: 10,
                },
              },
              required: [],
            },
          },
          {
            name: 'manage_bookmark',
            description: 'Add or remove a tweet bookmark',
            inputSchema: {
              type: 'object',
              properties: {
                tweetId: {
                  type: 'string',
                  description: 'Tweet ID to bookmark/unbookmark',
                },
                action: {
                  type: 'string',
                  enum: ['add', 'remove'],
                  description: 'Action to perform: add or remove bookmark',
                },
              },
              required: ['tweetId', 'action'],
            },
          },
          {
            name: 'get_my_likes',
            description: 'Fetch your liked tweets',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Number of liked tweets to fetch (1-100)',
                  minimum: 1,
                  maximum: 100,
                  default: 10,
                },
              },
              required: [],
            },
          },
          {
            name: 'manage_like',
            description: 'Like or unlike a tweet',
            inputSchema: {
              type: 'object',
              properties: {
                tweetId: {
                  type: 'string',
                  description: 'Tweet ID to like/unlike',
                },
                action: {
                  type: 'string',
                  enum: ['like', 'unlike'],
                  description: 'Action to perform: like or unlike',
                },
              },
              required: ['tweetId', 'action'],
            },
          },
          {
            name: 'get_my_timeline',
            description: 'Get your home timeline tweets',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Number of timeline tweets to fetch (1-100)',
                  minimum: 1,
                  maximum: 100,
                  default: 10,
                },
              },
              required: [],
            },
          },
        ];
        
        return {
          tools,
        };
      });
    
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'get_user_profile': {
            const parsed = XTools.schemas.getUserProfile.parse(args);
            return await this.tools.getUserProfile(parsed);
          }
          
          case 'get_user_timeline': {
            const parsed = XTools.schemas.getUserTimeline.parse(args);
            return await this.tools.getUserTimeline(parsed);
          }
          
          case 'search_tweets': {
            const parsed = XTools.schemas.searchTweets.parse(args);
            return await this.tools.searchTweets(parsed);
          }
          
          case 'get_user_followers': {
            const parsed = XTools.schemas.getUserFollowers.parse(args);
            return await this.tools.getUserFollowers(parsed);
          }
          
          case 'get_user_following': {
            const parsed = XTools.schemas.getUserFollowing.parse(args);
            return await this.tools.getUserFollowing(parsed);
          }
          
          case 'get_my_profile': {
            const parsed = XTools.schemas.getMyProfile.parse(args);
            return await this.tools.getMyProfile(parsed);
          }
          
          case 'get_my_timeline': {
            const parsed = XTools.schemas.getMyTimeline.parse(args);
            return await this.tools.getMyTimeline(parsed);
          }
          
          case 'get_my_bookmarks': {
            const parsed = XTools.schemas.getMyBookmarks.parse(args);
            return await this.tools.getMyBookmarks(parsed);
          }
          
          case 'manage_bookmark': {
            const parsed = XTools.schemas.manageBookmark.parse(args);
            return await this.tools.manageBookmark(parsed);
          }
          
          case 'get_my_likes': {
            const parsed = XTools.schemas.getMyLikes.parse(args);
            return await this.tools.getMyLikes(parsed);
          }
          
          case 'manage_like': {
            const parsed = XTools.schemas.manageLike.parse(args);
            return await this.tools.manageLike(parsed);
          }
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        // Handle validation errors
        if (error instanceof Error && error.name === 'ZodError') {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid parameters: ${error.message}`
          );
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }
  
  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Server Error]', error);
    };
  }
  
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('X Profile MCP Server running on stdio');
    console.error('Available tools: get_user_profile, get_user_timeline, search_tweets, get_user_followers, get_user_following, get_my_profile, get_my_timeline, get_my_bookmarks, manage_bookmark, get_my_likes, manage_like');
  }
}

// Start the server
async function main() {
  try {
    const server = new XProfileMCPServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}