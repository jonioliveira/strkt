import { db } from "#/db"
import { athletes } from "#/db/schema"
import { eq } from "drizzle-orm"

const API_KEY = process.env.YOUTUBE_API_KEY
const BASE = "https://www.googleapis.com/youtube/v3"

interface ChannelStats {
  subscriberCount: number
  views30d: number
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`YouTube API error ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

export async function fetchYouTubeStats(channelId: string): Promise<ChannelStats> {
  if (!API_KEY) throw new Error("YOUTUBE_API_KEY não configurada no servidor.")

  // Channel-level stats (subscribers)
  const channelRes = await fetchJson<{
    items?: Array<{ statistics: { subscriberCount: string; viewCount: string } }>
  }>(`${BASE}/channels?part=statistics&id=${encodeURIComponent(channelId)}&key=${API_KEY}`)

  const item = channelRes.items?.[0]
  if (!item) throw new Error(`Canal YouTube não encontrado: ${channelId}`)

  const subscriberCount = Number(item.statistics.subscriberCount ?? 0)

  // Videos published in the last 30 days → sum their views
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const searchRes = await fetchJson<{
    items?: Array<{ id: { videoId: string } }>
  }>(
    `${BASE}/search?channelId=${encodeURIComponent(channelId)}&type=video&publishedAfter=${encodeURIComponent(since)}&maxResults=50&order=date&part=id&key=${API_KEY}`,
  )

  const videoIds = (searchRes.items ?? []).map((v) => v.id.videoId).filter(Boolean)

  let views30d = 0
  if (videoIds.length > 0) {
    const statsRes = await fetchJson<{
      items?: Array<{ statistics: { viewCount: string } }>
    }>(`${BASE}/videos?id=${videoIds.join(",")}&part=statistics&key=${API_KEY}`)

    views30d = (statsRes.items ?? []).reduce(
      (sum, v) => sum + Number(v.statistics.viewCount ?? 0),
      0,
    )
  }

  return { subscriberCount, views30d }
}

export async function getAthleteYouTubeChannelId(athleteId: string): Promise<string | null> {
  const [athlete] = await db
    .select({ youtubeChannelId: athletes.youtubeChannelId })
    .from(athletes)
    .where(eq(athletes.id, athleteId))
    .limit(1)
  return athlete?.youtubeChannelId ?? null
}
