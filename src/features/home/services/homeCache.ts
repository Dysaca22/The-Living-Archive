const dataCache = new Map<string, { expiresAt: number; value: unknown }>();
const inFlightCache = new Map<string, Promise<unknown>>();

export async function withSimpleCache<T>(
  cacheKey: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = dataCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const inFlight = inFlightCache.get(cacheKey);
  if (inFlight) {
    return (await inFlight) as T;
  }

  const request = fetcher()
    .then((value) => {
      dataCache.set(cacheKey, { expiresAt: now + ttlMs, value });
      return value;
    })
    .finally(() => {
      inFlightCache.delete(cacheKey);
    });

  inFlightCache.set(cacheKey, request);
  return request;
}
