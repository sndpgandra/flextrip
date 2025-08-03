// Simple in-memory rate limiting for development
// In production, consider using Redis or Upstash

interface RateLimitEntry {
  requests: number[];
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export function rateLimit(
  identifier: string, 
  limit: number = 5, 
  windowMs: number = 60000 // 1 minute
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Get or create entry for this identifier
  let entry = rateLimitMap.get(identifier);
  if (!entry) {
    entry = { requests: [] };
    rateLimitMap.set(identifier, entry);
  }
  
  // Filter out old requests outside the window
  entry.requests = entry.requests.filter(time => time > windowStart);
  
  // Check if limit exceeded
  if (entry.requests.length >= limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.requests[0] + windowMs
    };
  }
  
  // Add current request
  entry.requests.push(now);
  
  return {
    success: true,
    remaining: limit - entry.requests.length,
    resetTime: now + windowMs
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const cutoff = now - (5 * 60 * 1000); // 5 minutes
  
  for (const [key, entry] of rateLimitMap.entries()) {
    entry.requests = entry.requests.filter(time => time > cutoff);
    if (entry.requests.length === 0) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Run cleanup every minute