import { z } from 'zod';
import { TwitterClient } from './twitter-client.js';

export class XTools {
  private twitterClient: TwitterClient;
  
  constructor() {
    try {
      this.twitterClient = new TwitterClient();
    } catch (error) {
      throw new Error(`Failed to initialize Twitter client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Schema definitions for all tool inputs
  static schemas = {
    // Profile and User Operations
    getUserProfile: z.object({
      username: z.string().min(1).describe('X/Twitter username (without @)')
    }),
    
    getMyProfile: z.object({}),
    
    // Timeline Operations
    getUserTimeline: z.object({
      username: z.string().min(1).describe('X/Twitter username (without @)'),
      limit: z.number().min(1).max(100).default(10).describe('Number of tweets to fetch (1-100)')
    }),
    
    getMyTimeline: z.object({
      limit: z.number().min(1).max(100).default(10).describe('Number of timeline tweets to fetch (1-100)')
    }),
    
    // Search Operations
    searchTweets: z.object({
      query: z.string().min(1).describe('Search query (keywords, hashtags, etc.)'),
      limit: z.number().min(1).max(100).default(10).describe('Number of tweets to fetch (1-100)')
    }),
    
    // Social Network Operations
    getUserFollowers: z.object({
      username: z.string().min(1).describe('X/Twitter username (without @)'),
      limit: z.number().min(1).max(1000).default(10).describe('Number of followers to fetch (1-1000)')
    }),
    
    getUserFollowing: z.object({
      username: z.string().min(1).describe('X/Twitter username (without @)'),
      limit: z.number().min(1).max(1000).default(10).describe('Number of following accounts to fetch (1-1000)')
    }),
    
    // Bookmark Operations
    getMyBookmarks: z.object({
      limit: z.number().min(1).max(100).default(10).describe('Number of bookmarks to fetch (1-100)')
    }),
    
    manageBookmark: z.object({
      tweetId: z.string().min(1).describe('Tweet ID to bookmark/unbookmark'),
      action: z.enum(['add', 'remove']).describe('Action to perform: add or remove bookmark')
    }),
    
    // Like Operations
    getMyLikes: z.object({
      limit: z.number().min(1).max(100).default(10).describe('Number of liked tweets to fetch (1-100)')
    }),
    
    manageLike: z.object({
      tweetId: z.string().min(1).describe('Tweet ID to like/unlike'),
      action: z.enum(['like', 'unlike']).describe('Action to perform: like or unlike')
    })
  };
  
  // Tool implementations
  
  // Profile and User Operations
  async getUserProfile(params: z.infer<typeof XTools.schemas.getUserProfile>) {
    try {
      const { username } = params;
      
      if (username.startsWith('@')) {
        throw new Error('Username should not include @ symbol');
      }
      
      const profile = await this.twitterClient.getUserProfile(username);
      
      if (!profile) {
        return {
          content: [{ 
            type: "text" as const, 
            text: `User @${username} not found or private account.` 
          }]
        };
      }
      
      const formattedProfile = this.twitterClient.formatUserProfile(profile);
      
      return {
        content: [{ 
          type: "text" as const, 
          text: formattedProfile 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error fetching profile: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  async getUserTimeline(params: z.infer<typeof XTools.schemas.getUserTimeline>) {
    try {
      const { username, limit } = params;
      
      if (username.startsWith('@')) {
        throw new Error('Username should not include @ symbol');
      }
      
      const tweets = await this.twitterClient.getUserTimeline(username, limit);
      
      if (!tweets.length) {
        return {
          content: [{ 
            type: "text" as const, 
            text: `No recent tweets found for @${username}.` 
          }]
        };
      }
      
      const formattedTweets = this.twitterClient.formatTweets(tweets);
      
      return {
        content: [{ 
          type: "text" as const, 
          text: `**Recent tweets from @${username} (${tweets.length} tweets):**\n\n${formattedTweets}` 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error fetching timeline: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  async searchTweets(params: z.infer<typeof XTools.schemas.searchTweets>) {
    try {
      const { query, limit } = params;
      
      const tweets = await this.twitterClient.searchTweets(query, limit);
      
      if (!tweets.length) {
        return {
          content: [{ 
            type: "text" as const, 
            text: `No tweets found for query: "${query}"` 
          }]
        };
      }
      
      const formattedTweets = this.twitterClient.formatTweets(tweets);
      
      return {
        content: [{ 
          type: "text" as const, 
          text: `**Search results for "${query}" (${tweets.length} tweets):**\n\n${formattedTweets}` 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error searching tweets: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  async getUserFollowers(params: z.infer<typeof XTools.schemas.getUserFollowers>) {
    try {
      const { username, limit } = params;
      
      if (username.startsWith('@')) {
        throw new Error('Username should not include @ symbol');
      }
      
      const followers = await this.twitterClient.getUserFollowers(username, limit);
      
      if (!followers.length) {
        return {
          content: [{ 
            type: "text" as const, 
            text: `No followers found for @${username} or account is private.` 
          }]
        };
      }
      
      const formattedUsers = this.twitterClient.formatUsers(followers);
      
      return {
        content: [{ 
          type: "text" as const, 
          text: `**Followers of @${username} (${followers.length} users):**\n\n${formattedUsers}` 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error fetching followers: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  async getUserFollowing(params: z.infer<typeof XTools.schemas.getUserFollowing>) {
    try {
      const { username, limit } = params;
      
      if (username.startsWith('@')) {
        throw new Error('Username should not include @ symbol');
      }
      
      const following = await this.twitterClient.getUserFollowing(username, limit);
      
      if (!following.length) {
        return {
          content: [{ 
            type: "text" as const, 
            text: `No following accounts found for @${username} or account is private.` 
          }]
        };
      }
      
      const formattedUsers = this.twitterClient.formatUsers(following);
      
      return {
        content: [{ 
          type: "text" as const, 
          text: `**Accounts followed by @${username} (${following.length} users):**\n\n${formattedUsers}` 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error fetching following: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  // Personal Operations
  async getMyProfile(params: z.infer<typeof XTools.schemas.getMyProfile>) {
    try {
      const profile = await this.twitterClient.getMyProfile();
      const formattedProfile = this.twitterClient.formatUserProfile(profile);
      
      return {
        content: [{ 
          type: "text" as const, 
          text: `**Your X Profile:**\n\n${formattedProfile}` 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error fetching your profile: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  async getMyTimeline(params: z.infer<typeof XTools.schemas.getMyTimeline>) {
    try {
      const { limit } = params;
      const timeline = await this.twitterClient.getMyTimeline(limit);
      const formattedTimeline = this.twitterClient.formatMyTimeline(timeline);
      
      return {
        content: [{ 
          type: "text" as const, 
          text: formattedTimeline 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error fetching timeline: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  // Bookmark Operations
  async getMyBookmarks(params: z.infer<typeof XTools.schemas.getMyBookmarks>) {
    try {
      const { limit } = params;
      const bookmarks = await this.twitterClient.getMyBookmarks(limit);
      const formattedBookmarks = this.twitterClient.formatBookmarks(bookmarks);
      
      return {
        content: [{ 
          type: "text" as const, 
          text: formattedBookmarks 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error fetching bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  async manageBookmark(params: z.infer<typeof XTools.schemas.manageBookmark>) {
    try {
      const { tweetId, action } = params;
      
      let result: boolean;
      if (action === 'add') {
        result = await this.twitterClient.addBookmark(tweetId);
      } else {
        result = await this.twitterClient.removeBookmark(tweetId);
      }
      
      const actionText = action === 'add' ? 'bookmarked' : 'removed from bookmarks';
      const successText = result ? `Successfully ${actionText} tweet ${tweetId}` : `Failed to ${action} bookmark for tweet ${tweetId}`;
      
      return {
        content: [{ 
          type: "text" as const, 
          text: successText 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error managing bookmark: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  // Like Operations
  async getMyLikes(params: z.infer<typeof XTools.schemas.getMyLikes>) {
    try {
      const { limit } = params;
      const likes = await this.twitterClient.getMyLikes(limit);
      const formattedLikes = this.twitterClient.formatLikes(likes);
      
      return {
        content: [{ 
          type: "text" as const, 
          text: formattedLikes 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error fetching liked tweets: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  async manageLike(params: z.infer<typeof XTools.schemas.manageLike>) {
    try {
      const { tweetId, action } = params;
      
      let result: boolean;
      if (action === 'like') {
        result = await this.twitterClient.likeTweet(tweetId);
      } else {
        result = await this.twitterClient.unlikeTweet(tweetId);
      }
      
      const actionText = action === 'like' ? 'liked' : 'unliked';
      const successText = result ? `Successfully ${actionText} tweet ${tweetId}` : `Failed to ${action} tweet ${tweetId}`;
      
      return {
        content: [{ 
          type: "text" as const, 
          text: successText 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error managing like: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
}