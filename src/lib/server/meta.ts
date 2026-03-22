const GRAPH_BASE = "https://graph.facebook.com/v20.0"

interface MetaStats {
  followersCount: number
  reach30d: number
  impressions30d: number
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Meta API error ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

export async function fetchMetaStats(
  igUserId: string,
  accessToken: string,
): Promise<MetaStats> {
  const token = encodeURIComponent(accessToken)
  const id = encodeURIComponent(igUserId)

  // Followers count
  const profileRes = await fetchJson<{
    followers_count?: number
    error?: { message: string }
  }>(`${GRAPH_BASE}/${id}?fields=followers_count&access_token=${token}`)

  if (profileRes.error) throw new Error(`Meta API: ${profileRes.error.message}`)
  const followersCount = profileRes.followers_count ?? 0

  // Reach + impressions over last 28 days (closest Meta offers to 30d)
  const insightsRes = await fetchJson<{
    data?: Array<{ name: string; values: Array<{ value: number }> }>
    error?: { message: string }
  }>(
    `${GRAPH_BASE}/${id}/insights?metric=reach,impressions&period=days_28&access_token=${token}`,
  )

  if (insightsRes.error) throw new Error(`Meta Insights API: ${insightsRes.error.message}`)

  let reach30d = 0
  let impressions30d = 0

  for (const metric of insightsRes.data ?? []) {
    const latest = metric.values.at(-1)?.value ?? 0
    if (metric.name === "reach") reach30d = latest
    if (metric.name === "impressions") impressions30d = latest
  }

  return { followersCount, reach30d, impressions30d }
}
