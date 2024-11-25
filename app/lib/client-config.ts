// This is a safe way to expose certain config values to the client
export const clientConfig = {
  // Only expose the first API key for read-only operations
  API_KEY: process.env.NEXT_PUBLIC_API_KEY || '',
};
