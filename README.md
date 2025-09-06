# X Profile MCP Server

A Model Context Protocol (MCP) server that provides Claude with comprehensive X (Twitter) interaction capabilities. Using OAuth 2.0 authentication, this server enables both public data access and personal account management.

## Features

- **User Profiles**: Fetch detailed user information including bio, follower count, and verification status
- **Timeline Access**: Retrieve recent tweets from any public user or your personal home timeline
- **Tweet Search**: Search for tweets by keywords, hashtags, or phrases  
- **Network Exploration**: Get followers and following lists for any user
- **Personal Profile**: Access your authenticated profile information
- **Bookmarks**: View, add, and remove tweet bookmarks
- **Likes**: View your liked tweets and like/unlike tweets
- **Rich Formatting**: Well-formatted responses with engagement metrics
- **Secure Authentication**: OAuth 2.0 with automatic token refresh

## Prerequisites

- Node.js v18.x or higher
- X/Twitter OAuth 2.0 App credentials (Client ID and Secret)

## Installation

1. **Clone or download this repository**

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your X/Twitter API credentials:
   ```bash
   # OAuth 2.0 Client Credentials - Required for all operations
   X_CLIENT_ID=your_client_id_here
   X_CLIENT_SECRET=your_client_secret_here
   X_REDIRECT_URI=http://localhost:3000/callback
   ```

## Getting X/Twitter API Credentials

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or use an existing one
3. Go to the app "Settings" tab
4. Edit "Authentication settings"
5. Enable "OAuth 2.0" 
6. Set "Type of App" to "Web App"
7. Add callback URL: `http://localhost:3000/callback`
8. Save settings
9. Copy your "Client ID" and "Client Secret" from the "Keys and Tokens" tab

**Important**: Ensure your app has these scopes enabled:
- `tweet.read` - Read tweets  
- `users.read` - Read user profiles
- `bookmark.read` - Read bookmarks
- `bookmark.write` - Manage bookmarks
- `like.read` - Read likes
- `like.write` - Manage likes
- `offline.access` - Enable token refresh

## Usage

### 1. Authenticate with X/Twitter (Required)

Before using the server, you must authenticate:

```bash
pnpm run setup-auth
```

This will:
- Generate an OAuth 2.0 authorization URL
- Open your browser for authentication
- Capture the authorization callback
- Save your access tokens for all operations

### 2. Build the server
```bash
pnpm run build
```

### 3. Run the server

**Development mode:**
```bash
pnpm run dev
```

**Production mode:**
```bash
pnpm start
```

### Reset Authentication (if needed)
```bash
pnpm run reset-auth
```

## Claude Desktop Integration

Add this server to your Claude Desktop configuration file:

**Location**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "x-profile": {
      "command": "node",
      "args": ["/path/to/your/project/build/index.js"],
      "env": {
        "X_BEARER_TOKEN": "your_bearer_token_here"
      }
    }
  }
}
```

Alternative using development mode:
```json
{
  "mcpServers": {
    "x-profile": {
      "command": "npx",
      "args": ["tsx", "/path/to/your/project/src/index.ts"],
      "env": {
        "X_BEARER_TOKEN": "your_bearer_token_here"
      }
    }
  }
}
```

## Available Tools

### 1. `get_user_profile`
Fetch detailed user profile information.

**Parameters:**
- `username` (string): X/Twitter username (without @)

**Example:**
```
Get the profile for elonmusk
```

### 2. `get_user_timeline`
Retrieve recent tweets from a user's timeline.

**Parameters:**
- `username` (string): X/Twitter username (without @)
- `limit` (number, optional): Number of tweets to fetch (1-100, default: 10)

**Example:**
```
Get the last 5 tweets from openai
```

### 3. `search_tweets`
Search for tweets by keywords, hashtags, or phrases.

**Parameters:**
- `query` (string): Search query
- `limit` (number, optional): Number of tweets to fetch (1-100, default: 10)

**Example:**
```
Search for tweets about #MachineLearning
```

### 4. `get_user_followers`
Fetch a list of users following the specified account.

**Parameters:**
- `username` (string): X/Twitter username (without @)
- `limit` (number, optional): Number of followers to fetch (1-1000, default: 10)

**Example:**
```
Get 20 followers of sama
```

### 5. `get_user_following`
Fetch a list of users that the specified account follows.

**Parameters:**
- `username` (string): X/Twitter username (without @)
- `limit` (number, optional): Number of following accounts to fetch (1-1000, default: 10)

**Example:**
```
Get accounts followed by karpathy
```

### 6. `get_my_profile`
Get your authenticated X/Twitter profile information.

**Parameters:** None

**Example:**
```
Get my profile information
```

### 7. `get_my_bookmarks`
Fetch your bookmarked tweets.

**Parameters:**
- `limit` (number, optional): Number of bookmarks to fetch (1-100, default: 10)

**Example:**
```
Show me my last 20 bookmarks
```

### 8. `manage_bookmark`
Add or remove a tweet bookmark.

**Parameters:**
- `tweetId` (string): Tweet ID to bookmark/unbookmark
- `action` (string): Either "add" or "remove"

**Example:**
```
Bookmark the tweet with ID 1234567890
```

### 9. `get_my_likes`
Fetch your liked tweets.

**Parameters:**
- `limit` (number, optional): Number of liked tweets to fetch (1-100, default: 10)

**Example:**
```
Show me my recent liked tweets
```

### 10. `manage_like`
Like or unlike a tweet.

**Parameters:**
- `tweetId` (string): Tweet ID to like/unlike
- `action` (string): Either "like" or "unlike"

**Example:**
```
Like the tweet with ID 1234567890
```

### 11. `get_my_timeline`
Get your home timeline tweets.

**Parameters:**
- `limit` (number, optional): Number of timeline tweets to fetch (1-100, default: 10)

**Example:**
```
Show me my home timeline
```

## Rate Limiting

This server respects X/Twitter API rate limits. If you encounter rate limiting errors:

- Wait for the rate limit window to reset
- Reduce the number of requests
- Consider upgrading your API access level

## Error Handling

The server handles various error scenarios:

- **Invalid usernames**: Returns "User not found" message
- **Private accounts**: Returns appropriate privacy message  
- **API errors**: Provides descriptive error messages
- **Rate limits**: Returns rate limit information

## Development

### Project Structure
```
src/
├── index.ts          # Main MCP server implementation
├── twitter-client.ts # X/Twitter API client wrapper
└── tools.ts          # MCP tool implementations

build/                # Compiled JavaScript output
```

### Scripts
- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm run dev` - Run in development mode with tsx
- `pnpm start` - Run the compiled server

## Security

- Never commit your `.env` file with API credentials
- Use Bearer tokens for read-only operations when possible
- Be mindful of API rate limits to avoid account suspension

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
1. Check the [X/Twitter API documentation](https://developer.twitter.com/en/docs/twitter-api)
2. Review the [MCP specification](https://modelcontextprotocol.io/)
3. Open an issue in this repository