// STRKT Score — 0 to 100
// Weights: 40% reach | 25% engagement | 20% results | 15% consistency

interface ResultInput {
  position: number | null
  totalParticipants: number | null
  eventDate: string
}

interface ScoreInput {
  totalReach30d: number
  engagementRate: number // e.g. 0.085 = 8.5%
  resultsLast90d: ResultInput[]
  postsLast30d: number
}

interface ScoreBreakdown {
  reach: number
  engagement: number
  results: number
  consistency: number
  total: number
}

const REACH_REFERENCE = 500_000 // 500k monthly reach = 40 pts
const ENGAGEMENT_REFERENCE = 0.06 // 6% = 25 pts baseline
const POSTS_REFERENCE = 12 // 12 posts/month = 15 pts

function positionScore(position: number | null, total: number | null): number {
  if (!position || !total || total === 0) return 0
  const percentile = 1 - (position - 1) / total
  // Top 1% → 10 pts, top 10% → 7, top 50% → 3, else proportional
  if (percentile >= 0.99) return 10
  if (percentile >= 0.9) return 8
  if (percentile >= 0.75) return 6
  if (percentile >= 0.5) return 3
  return Math.round(percentile * 6)
}

function recencyMultiplier(eventDate: string): number {
  const daysSince =
    (Date.now() - new Date(eventDate).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSince <= 30) return 1
  if (daysSince <= 60) return 0.75
  return 0.5
}

export function calculateStrktScore(input: ScoreInput): ScoreBreakdown {
  // Reach component (0–40)
  const reach = Math.min(40, Math.round((input.totalReach30d / REACH_REFERENCE) * 40))

  // Engagement component (0–25)
  const engagement = Math.min(
    25,
    Math.round((input.engagementRate / ENGAGEMENT_REFERENCE) * 25),
  )

  // Results component (0–20)
  const rawResults = input.resultsLast90d.reduce((acc, r) => {
    return acc + positionScore(r.position, r.totalParticipants) * recencyMultiplier(r.eventDate)
  }, 0)
  const results = Math.min(20, Math.round(rawResults))

  // Consistency component (0–15)
  const consistency = Math.min(
    15,
    Math.round((input.postsLast30d / POSTS_REFERENCE) * 15),
  )

  const total = reach + engagement + results + consistency

  return { reach, engagement, results, consistency, total }
}

export function scoreWeights() {
  return { reach: 0.4, engagement: 0.25, results: 0.2, consistency: 0.15 }
}
