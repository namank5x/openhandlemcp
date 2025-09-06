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
    }),
    
    // List Operations
    getMyLists: z.object({}),
    
    getList: z.object({
      listId: z.string().min(1).describe('List ID to fetch')
    }),
    
    getListTweets: z.object({
      listId: z.string().min(1).describe('List ID to get tweets from'),
      limit: z.number().min(1).max(100).default(10).describe('Number of tweets to fetch (1-100)')
    }),
    
    getListMembers: z.object({
      listId: z.string().min(1).describe('List ID to get members from'),
      limit: z.number().min(1).max(100).default(10).describe('Number of members to fetch (1-100)')
    }),
    
    createList: z.object({
      name: z.string().min(1).max(25).describe('List name (max 25 characters)'),
      description: z.string().max(100).optional().describe('List description (max 100 characters)'),
      private: z.boolean().default(false).describe('Whether the list should be private')
    }),
    
    updateList: z.object({
      listId: z.string().min(1).describe('List ID to update'),
      name: z.string().min(1).max(25).optional().describe('New list name (max 25 characters)'),
      description: z.string().max(100).optional().describe('New list description (max 100 characters)'),
      private: z.boolean().optional().describe('Whether the list should be private')
    }),
    
    deleteList: z.object({
      listId: z.string().min(1).describe('List ID to delete')
    }),
    
    manageListMember: z.object({
      listId: z.string().min(1).describe('List ID to manage'),
      username: z.string().min(1).describe('Username to add/remove (without @)'),
      action: z.enum(['add', 'remove']).describe('Action to perform: add or remove member')
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
  
  // List Operations
  
  async getMyLists(params: z.infer<typeof XTools.schemas.getMyLists>) {
    try {
      const lists = await this.twitterClient.getMyLists();
      
      if (!lists.length) {
        return {
          content: [{ 
            type: "text" as const, 
            text: 'You have no lists.' 
          }]
        };
      }
      
      const formattedLists = this.twitterClient.formatLists(lists);
      
      return {
        content: [{ 
          type: "text" as const, 
          text: `**Your Lists (${lists.length}):**\n\n${formattedLists}` 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error fetching lists: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  async getList(params: z.infer<typeof XTools.schemas.getList>) {
    try {
      const { listId } = params;
      const list = await this.twitterClient.getList(listId);
      
      const formattedList = this.twitterClient.formatListDetails(list);
      
      return {
        content: [{ 
          type: "text" as const, 
          text: formattedList 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error fetching list: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  async getListTweets(params: z.infer<typeof XTools.schemas.getListTweets>) {
    try {
      const { listId, limit = 10 } = params;
      
      // Get list details for name
      const list = await this.twitterClient.getList(listId);
      const tweets = await this.twitterClient.getListTweets(listId, limit);
      
      const formattedTweets = this.twitterClient.formatListTweets(tweets, list.name);
      
      return {
        content: [{ 
          type: "text" as const, 
          text: formattedTweets 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error fetching list tweets: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  async getListMembers(params: z.infer<typeof XTools.schemas.getListMembers>) {
    try {
      const { listId, limit = 10 } = params;
      
      // Get list details for name
      const list = await this.twitterClient.getList(listId);
      const members = await this.twitterClient.getListMembers(listId, limit);
      
      const formattedMembers = this.twitterClient.formatListMembers(members, list.name);
      
      return {
        content: [{ 
          type: "text" as const, 
          text: formattedMembers 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error fetching list members: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  async createList(params: z.infer<typeof XTools.schemas.createList>) {
    try {
      const { name, description, private: isPrivate = false } = params;
      
      const newList = await this.twitterClient.createList(name, description, isPrivate);
      
      return {
        content: [{ 
          type: "text" as const, 
          text: `Successfully created list "${name}" (ID: ${newList.id})${description ? `\nDescription: ${description}` : ''}${isPrivate ? '\nPrivacy: Private' : '\nPrivacy: Public'}` 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error creating list: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  async updateList(params: z.infer<typeof XTools.schemas.updateList>) {
    try {
      const { listId, name, description, private: isPrivate } = params;
      
      if (!name && description === undefined && isPrivate === undefined) {
        return {
          content: [{ 
            type: "text" as const, 
            text: 'No changes specified. Please provide at least one field to update (name, description, or privacy).' 
          }]
        };
      }
      
      await this.twitterClient.updateList(listId, name, description, isPrivate);
      
      const changes = [];
      if (name) changes.push(`Name: "${name}"`);
      if (description !== undefined) changes.push(`Description: "${description || 'No description'}"`);
      if (isPrivate !== undefined) changes.push(`Privacy: ${isPrivate ? 'Private' : 'Public'}`);
      
      return {
        content: [{ 
          type: "text" as const, 
          text: `Successfully updated list ${listId}\n${changes.join('\n')}` 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error updating list: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  async deleteList(params: z.infer<typeof XTools.schemas.deleteList>) {
    try {
      const { listId } = params;
      
      const result = await this.twitterClient.deleteList(listId);
      const successText = result ? `Successfully deleted list ${listId}` : `Failed to delete list ${listId}`;
      
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
          text: `Error deleting list: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
  
  async manageListMember(params: z.infer<typeof XTools.schemas.manageListMember>) {
    try {
      const { listId, username, action } = params;
      
      if (username.startsWith('@')) {
        throw new Error('Username should not include @ symbol');
      }
      
      let result: boolean;
      if (action === 'add') {
        result = await this.twitterClient.addListMember(listId, username);
      } else {
        result = await this.twitterClient.removeListMember(listId, username);
      }
      
      const actionText = action === 'add' ? 'added to' : 'removed from';
      const successText = result ? `Successfully ${actionText} list ${listId}: @${username}` : `Failed to ${action} @${username} ${action === 'add' ? 'to' : 'from'} list ${listId}`;
      
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
          text: `Error managing list member: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }]
      };
    }
  }
}