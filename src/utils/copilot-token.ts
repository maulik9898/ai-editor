interface TokenCache {
  token: string | null;
  expiresAt: number | null;
}

let tokenCache: TokenCache = {
  token: null,
  expiresAt: null,
};

export async function getCopilotToken(): Promise<string> {
  // Check if current token is still valid (with 5 min buffer)
  const now = Date.now() / 1000; // Convert to seconds
  const bufferTime = 5 * 60; // 5 minutes in seconds

  if (
    tokenCache.token &&
    tokenCache.expiresAt &&
    tokenCache.expiresAt - bufferTime > now
  ) {
    return tokenCache.token;
  }

  // Fetch new token from GitHub
  try {
    const response = await fetch(
      "https://api.github.com/copilot_internal/v2/token",
      {
        headers: {
          authorization: `token ${process.env.GITHUB_OAUTH_TOKEN}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    // Cache the new token
    tokenCache = {
      token: data.token,
      expiresAt: data.expires_at,
    };

    return data.token;
  } catch (error) {
    console.error("Failed to fetch Copilot token:", error);
    throw error;
  }
}
