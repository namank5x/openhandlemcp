import { TwitterApi, UserV2, TweetV2 } from 'twitter-api-v2';
import { z } from 'zod';
import dotenv from 'dotenv';
import { OAuth2AuthManager } from './auth-manager.js';

dotenv.config();

export class TwitterClient {
  private authManager: OAuth2AuthManager;
  
  constructor() {
    // Initialize OAuth 2.0 auth manager
    try {
      this.authManager = new OAuth2AuthManager();
    } catch (error) {
      throw new Error(`OAuth 2.0 not configured. Please set X_CLIENT_ID and X_CLIENT_SECRET environment variables and run 'pnpm run setup-auth' to authenticate.`);
    }
  }
  
  private async getAuthenticatedClient(): Promise<TwitterApi> {
    const client = await this.authManager.getAuthenticatedClient();
    if (!client) {
      throw new Error('Not authenticated. Please run "pnpm run setup-auth" to authenticate with X/Twitter.');
    }
    return client;
  }
  
  async getUserProfile(username: string): Promise<UserV2 | null> {
    try {
      const client = await this.getAuthenticatedClient();
      const user = await client.v2.userByUsername(username, {
        'user.fields': ['id', 'name', 'username', 'description', 'public_metrics', 'verified', 'created_at', 'profile_image_url']
      });
      return user.data || null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('User not found')) {
        return null;
      }
      throw new Error(`Failed to fetch user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getUserTimeline(username: string, maxResults: number = 10): Promise<TweetV2[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const user = await client.v2.userByUsername(username);
      if (!user.data) {
        throw new Error('User not found');
      }
      
      const timeline = await client.v2.userTimeline(user.data.id, {
        max_results: Math.min(maxResults, 100),
        'tweet.fields': ['id', 'text', 'created_at', 'public_metrics', 'author_id'],
        exclude: ['retweets', 'replies']
      });
      
      return timeline.data.data || [];
    } catch (error) {
      throw new Error(`Failed to fetch user timeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async searchTweets(query: string, maxResults: number = 10): Promise<TweetV2[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const searchResults = await client.v2.search(query, {
        max_results: Math.min(maxResults, 100),
        'tweet.fields': ['id', 'text', 'created_at', 'public_metrics', 'author_id']
      });
      
      return searchResults.data.data || [];
    } catch (error) {
      throw new Error(`Failed to search tweets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getUserFollowers(username: string, maxResults: number = 10): Promise<UserV2[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const user = await client.v2.userByUsername(username);
      if (!user.data) {
        throw new Error('User not found');
      }
      
      const followers = await client.v2.followers(user.data.id, {
        max_results: Math.min(maxResults, 1000),
        'user.fields': ['id', 'name', 'username', 'description', 'public_metrics']
      });
      
      return followers.data || [];
    } catch (error) {
      throw new Error(`Failed to fetch followers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getUserFollowing(username: string, maxResults: number = 10): Promise<UserV2[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const user = await client.v2.userByUsername(username);
      if (!user.data) {
        throw new Error('User not found');
      }
      
      const following = await client.v2.following(user.data.id, {
        max_results: Math.min(maxResults, 1000),
        'user.fields': ['id', 'name', 'username', 'description', 'public_metrics']
      });
      
      return following.data || [];
    } catch (error) {
      throw new Error(`Failed to fetch following: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  formatUserProfile(user: UserV2): string {
    const metrics = user.public_metrics;
    return `**${user.name}** (@${user.username})
${user.description || 'No bio available'}

**Stats:**
- Followers: ${metrics?.followers_count?.toLocaleString() || 'N/A'}
- Following: ${metrics?.following_count?.toLocaleString() || 'N/A'}
- Tweets: ${metrics?.tweet_count?.toLocaleString() || 'N/A'}
- Listed: ${metrics?.listed_count?.toLocaleString() || 'N/A'}
- Verified: ${user.verified ? '✓' : '✗'}
- Created: ${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}`;
  }
  
  formatTweets(tweets: TweetV2[]): string {
    if (!tweets.length) {
      return 'No tweets found.';
    }
    
    return tweets.map(tweet => {
      const metrics = tweet.public_metrics;
      return `**Tweet ID:** ${tweet.id}
**Created:** ${tweet.created_at ? new Date(tweet.created_at).toLocaleString() : 'N/A'}
**Text:** ${tweet.text}
**Engagement:** ❤️ ${metrics?.like_count || 0} | 🔄 ${metrics?.retweet_count || 0} | 💬 ${metrics?.reply_count || 0}
---`;
    }).join('\n\n');
  }
  
  formatUsers(users: UserV2[]): string {
    if (!users.length) {
      return 'No users found.';
    }
    
    return users.map(user => {
      const metrics = user.public_metrics;
      return `**${user.name}** (@${user.username})
${user.description || 'No bio available'}
Followers: ${metrics?.followers_count?.toLocaleString() || 'N/A'}`;
    }).join('\n\n---\n\n');
  }
  
  // Personal data methods
  
  async isAuthenticationAvailable(): Promise<boolean> {
    return await this.authManager.isAuthenticated();
  }
  
  async getMyProfile(): Promise<UserV2> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client.v2.me({
        'user.fields': ['id', 'name', 'username', 'description', 'public_metrics', 'verified', 'created_at', 'profile_image_url']
      });
      
      if (!response.data) {
        throw new Error('Failed to fetch authenticated user profile');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch your profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getMyBookmarks(maxResults: number = 10): Promise<TweetV2[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client.v2.bookmarks({
        max_results: Math.min(maxResults, 100),
        'tweet.fields': ['id', 'text', 'created_at', 'public_metrics', 'author_id'],
        expansions: ['author_id']
      });
      
      return response.data.data || [];
    } catch (error) {
      throw new Error(`Failed to fetch bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async addBookmark(tweetId: string): Promise<boolean> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client.v2.bookmark(tweetId);
      return response.data?.bookmarked || false;
    } catch (error) {
      throw new Error(`Failed to add bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async removeBookmark(tweetId: string): Promise<boolean> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client.v2.deleteBookmark(tweetId);
      return response.data?.bookmarked === false;
    } catch (error) {
      throw new Error(`Failed to remove bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getMyLikes(maxResults: number = 10): Promise<TweetV2[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const myProfile = await this.getMyProfile();
      
      const response = await client.v2.userLikedTweets(myProfile.id, {
        max_results: Math.min(maxResults, 100),
        'tweet.fields': ['id', 'text', 'created_at', 'public_metrics', 'author_id'],
        expansions: ['author_id']
      });
      
      return response.data.data || [];
    } catch (error) {
      throw new Error(`Failed to fetch liked tweets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async likeTweet(tweetId: string): Promise<boolean> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client.v2.like(await this.getMyUserId(), tweetId);
      return response.data?.liked || false;
    } catch (error) {
      throw new Error(`Failed to like tweet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async unlikeTweet(tweetId: string): Promise<boolean> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client.v2.unlike(await this.getMyUserId(), tweetId);
      return response.data?.liked === false;
    } catch (error) {
      throw new Error(`Failed to unlike tweet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getMyTimeline(maxResults: number = 10): Promise<TweetV2[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client.v2.homeTimeline({
        max_results: Math.min(maxResults, 100),
        'tweet.fields': ['id', 'text', 'created_at', 'public_metrics', 'author_id'],
        expansions: ['author_id']
      });
      
      return response.data.data || [];
    } catch (error) {
      throw new Error(`Failed to fetch home timeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private async getMyUserId(): Promise<string> {
    const profile = await this.getMyProfile();
    return profile.id;
  }
  
  formatBookmarks(tweets: TweetV2[]): string {
    if (!tweets.length) {
      return 'No bookmarks found.';
    }
    
    return `**Your Bookmarks (${tweets.length} tweets):**\n\n${this.formatTweets(tweets)}`;
  }
  
  formatLikes(tweets: TweetV2[]): string {
    if (!tweets.length) {
      return 'No liked tweets found.';
    }
    
    return `**Your Liked Tweets (${tweets.length} tweets):**\n\n${this.formatTweets(tweets)}`;
  }
  
  formatMyTimeline(tweets: TweetV2[]): string {
    if (!tweets.length) {
      return 'No tweets in your timeline.';
    }
    
    return `**Your Home Timeline (${tweets.length} tweets):**\n\n${this.formatTweets(tweets)}`;
  }
  
  // List management methods
  
  async getMyLists(): Promise<any[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client.v2.listsOwned(await this.getMyUserId(), {
        max_results: 100,
        'list.fields': ['description', 'member_count', 'follower_count', 'private', 'created_at']
      });
      
      const lists = [];
      for await (const list of response) {
        lists.push(list);
      }
      
      return lists;
    } catch (error) {
      throw new Error(`Failed to fetch your lists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getList(listId: string): Promise<any> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client.v2.list(listId, {
        'list.fields': ['description', 'member_count', 'follower_count', 'private', 'created_at']
      });
      
      if (!response.data) {
        throw new Error('List not found');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getListTweets(listId: string, maxResults: number = 10): Promise<TweetV2[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client.v2.listTweets(listId, {
        max_results: Math.min(maxResults, 100),
        'tweet.fields': ['id', 'text', 'created_at', 'public_metrics', 'author_id'],
        expansions: ['author_id']
      });
      
      return response.data.data || [];
    } catch (error) {
      throw new Error(`Failed to fetch list tweets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getListMembers(listId: string, maxResults: number = 10): Promise<UserV2[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client.v2.listMembers(listId, {
        max_results: Math.min(maxResults, 100),
        'user.fields': ['id', 'name', 'username', 'description', 'public_metrics', 'verified']
      });
      
      const members = [];
      for await (const member of response) {
        members.push(member);
        if (members.length >= maxResults) break;
      }
      
      return members;
    } catch (error) {
      throw new Error(`Failed to fetch list members: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async createList(name: string, description?: string, isPrivate: boolean = false): Promise<any> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client.v2.createList({
        name,
        description,
        private: isPrivate
      });
      
      if (!response.data) {
        throw new Error('Failed to create list');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async updateList(listId: string, name?: string, description?: string, isPrivate?: boolean): Promise<any> {
    try {
      const client = await this.getAuthenticatedClient();
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (isPrivate !== undefined) updateData.private = isPrivate;
      
      const response = await client.v2.updateList(listId, updateData);
      
      if (!response.data?.updated) {
        throw new Error('Failed to update list');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async deleteList(listId: string): Promise<boolean> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client.v2.removeList(listId);
      
      return response.data?.deleted || false;
    } catch (error) {
      throw new Error(`Failed to delete list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async addListMember(listId: string, username: string): Promise<boolean> {
    try {
      const client = await this.getAuthenticatedClient();
      
      // Get user ID from username
      const userResponse = await client.v2.userByUsername(username);
      if (!userResponse.data) {
        throw new Error(`User @${username} not found`);
      }
      
      const response = await client.v2.addListMember(listId, userResponse.data.id);
      
      return response.data?.is_member || false;
    } catch (error) {
      throw new Error(`Failed to add member to list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async removeListMember(listId: string, username: string): Promise<boolean> {
    try {
      const client = await this.getAuthenticatedClient();
      
      // Get user ID from username
      const userResponse = await client.v2.userByUsername(username);
      if (!userResponse.data) {
        throw new Error(`User @${username} not found`);
      }
      
      const response = await client.v2.removeListMember(listId, userResponse.data.id);
      
      return response.data?.is_member === false;
    } catch (error) {
      throw new Error(`Failed to remove member from list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // List formatting methods
  
  formatLists(lists: any[]): string {
    if (!lists.length) {
      return 'No lists found.';
    }
    
    return lists.map(list => {
      return `**${list.name}** (ID: ${list.id})
${list.description || 'No description'}
Members: ${list.member_count || 0} | Followers: ${list.follower_count || 0}
Privacy: ${list.private ? 'Private' : 'Public'}
Created: ${list.created_at ? new Date(list.created_at).toLocaleDateString() : 'N/A'}`;
    }).join('\n\n---\n\n');
  }
  
  formatListDetails(list: any): string {
    return `**${list.name}** (ID: ${list.id})
${list.description || 'No description'}

**Stats:**
- Members: ${list.member_count || 0}
- Followers: ${list.follower_count || 0}
- Privacy: ${list.private ? 'Private' : 'Public'}
- Created: ${list.created_at ? new Date(list.created_at).toLocaleDateString() : 'N/A'}`;
  }
  
  formatListTweets(tweets: TweetV2[], listName: string): string {
    if (!tweets.length) {
      return `No tweets found in list "${listName}".`;
    }
    
    return `**Tweets from "${listName}" (${tweets.length} tweets):**\n\n${this.formatTweets(tweets)}`;
  }
  
  formatListMembers(members: UserV2[], listName: string): string {
    if (!members.length) {
      return `No members found in list "${listName}".`;
    }
    
    return `**Members of "${listName}" (${members.length} members):**\n\n${this.formatUsers(members)}`;
  }
}