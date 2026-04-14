type Bucket = {
  hits: number[];
};

const buckets = new Map<string, Bucket>();

function pruneOld(hits: number[], now: number, windowMs: number) {
  const cutoff = now - windowMs;
  while (hits.length > 0 && hits[0] < cutoff) {
    hits.shift();
  }
}

export function getClientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    return fwd.split(",")[0]?.trim() ?? "unknown";
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit(input: {
  key: string;
  max: number;
  windowMs: number;
}) {
  const now = Date.now();
  const bucket = buckets.get(input.key) ?? { hits: [] };
  pruneOld(bucket.hits, now, input.windowMs);

  if (bucket.hits.length >= input.max) {
    buckets.set(input.key, bucket);
    const retryAt = bucket.hits[0] + input.windowMs;
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((retryAt - now) / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(input.key, bucket);
  return {
    ok: true,
    remaining: Math.max(0, input.max - bucket.hits.length),
    retryAfterSec: 0,
  };
}
