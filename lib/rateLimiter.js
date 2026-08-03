/**
 * Simple In-Memory Rate Limiter
 * 
 * No external dependencies. Stores request counts per IP in memory.
 * Limits login attempts per IP within a sliding window.
 */
class RateLimiter {
  /**
   * @param {Object} options
   * @param {number} options.windowMs - Time window in milliseconds (default: 15 min)
   * @param {number} options.maxAttempts - Max attempts per window (default: 5)
   */
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.maxAttempts = options.maxAttempts || 5;
    this.clients = new Map();
  }

  /**
   * Check if a request from an IP is rate-limited
   * @param {string} ip - Client IP address
   * @returns {Object} { allowed: boolean, remaining: number, resetTime: number }
   */
  check(ip) {
    const now = Date.now();
    const clientKey = ip || 'unknown';

    if (!this.clients.has(clientKey)) {
      this.clients.set(clientKey, {
        count: 1,
        startTime: now
      });
      return {
        allowed: true,
        remaining: this.maxAttempts - 1,
        resetTime: now + this.windowMs
      };
    }

    const client = this.clients.get(clientKey);

    // If window has expired, reset
    if (now - client.startTime > this.windowMs) {
      client.count = 1;
      client.startTime = now;
      return {
        allowed: true,
        remaining: this.maxAttempts - 1,
        resetTime: now + this.windowMs
      };
    }

    // Increment count
    client.count++;

    if (client.count > this.maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: client.startTime + this.windowMs
      };
    }

    return {
      allowed: true,
      remaining: this.maxAttempts - client.count,
      resetTime: client.startTime + this.windowMs
    };
  }

  /**
   * Reset rate limit for a specific IP
   * @param {string} ip
   */
  reset(ip) {
    this.clients.delete(ip || 'unknown');
  }

  /**
   * Clean up expired entries periodically
   */
  cleanup() {
    const now = Date.now();
    for (const [ip, client] of this.clients.entries()) {
      if (now - client.startTime > this.windowMs) {
        this.clients.delete(ip);
      }
    }
  }
}

// Singleton instance
const loginLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5             // 5 attempts per window
});

// Run cleanup every minute
setInterval(() => {
  loginLimiter.cleanup();
}, 60 * 1000);

module.exports = {
  RateLimiter,
  loginLimiter
};
