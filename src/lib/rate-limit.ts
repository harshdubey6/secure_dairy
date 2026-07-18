const rateMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateMap.get(key);

  if (!record || now > record.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  record.count++;
  if (record.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RateLimitHandler = (...args: any[]) => Promise<Response>;

export function rateLimitMiddleware(handler: RateLimitHandler, { maxRequests = 10, windowMs = 60000 } = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (...args: any[]) => {
    const request = args[0];
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const result = checkRateLimit(ip, maxRequests, windowMs);

    if (!result.allowed) {
      const { NextResponse } = await import("next/server");
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    return handler(...args);
  };
}
