import Anthropic from '@anthropic-ai/sdk'
import { format, parseISO } from 'date-fns'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function buildPrompt(logs, period, profile) {
  const { name, gender } = profile
  const weeklyLimit = gender === 'female' ? 11 : 17

  if (!logs || logs.length === 0) {
    return `The user ${name} has no drinks logged for the ${period}. Give them a brief, friendly, slightly humorous message about having a clean slate this ${period}. Keep it short (2-3 sentences), warm, and maybe slightly suspicious that they might have just forgotten to log.`
  }

  const totalBeers = logs.length
  const totalMl = logs.reduce((sum, l) => sum + l.volume_ml, 0)
  const totalUnits = logs.reduce((sum, l) => sum + l.units, 0)
  const avgAbv = logs.reduce((sum, l) => sum + l.abv_percent, 0) / logs.length

  // Group by day
  const byDay = {}
  for (const log of logs) {
    const day = format(parseISO(log.logged_at), 'EEEE')
    byDay[day] = (byDay[day] || 0) + 1
  }

  const peakDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]

  // Most common beer
  const beerNames = logs.map(l => l.beer_name).filter(Boolean)
  const beerCount = {}
  for (const b of beerNames) beerCount[b] = (beerCount[b] || 0) + 1
  const favBeer = Object.entries(beerCount).sort((a, b) => b[1] - a[1])[0]

  // Volume preferences
  const avgVolume = totalMl / totalBeers

  const unitComparison = totalUnits <= weeklyLimit
    ? `${totalUnits.toFixed(1)} units this ${period}, which is within the HSE recommended ${weeklyLimit} unit weekly limit for ${gender === 'female' ? 'women' : 'men'}`
    : `${totalUnits.toFixed(1)} units this ${period}, which is ${(totalUnits - weeklyLimit).toFixed(1)} units over the HSE recommended ${weeklyLimit} unit weekly limit for ${gender === 'female' ? 'women' : 'men'}`

  const prompt = `You are giving a friendly, honest, slightly humorous drinking summary to ${name} for the past ${period}.

Here's their data:
- Total beers logged: ${totalBeers}
- Total volume: ${(totalMl / 1000).toFixed(2)} litres
- Total units: ${totalUnits.toFixed(1)} (HSE ${gender === 'female' ? 'women' : 'men'}'s limit: ${weeklyLimit}/week)
- Average ABV: ${avgAbv.toFixed(1)}%
- Average drink size: ${Math.round(avgVolume)}ml
- Drinking by day: ${Object.entries(byDay).map(([d, c]) => `${d}: ${c}`).join(', ')}
- Peak drinking day: ${peakDay ? `${peakDay[0]} (${peakDay[1]} beers)` : 'N/A'}
${favBeer ? `- Favourite beer: ${favBeer[0]} (${favBeer[1]} times)` : ''}
- Units vs guidelines: ${unitComparison}

Write a short, friendly summary (3-5 short paragraphs) that:
1. Briefly acknowledges how active they've been this ${period}
2. Notes any interesting patterns (peak days, preferred strength/volume)
3. Honestly but kindly references their unit count vs HSE guidelines — be direct but not preachy
4. Ends with a personalised, witty observation or encouragement

Keep the tone conversational, like a slightly cheeky but caring mate. No bullet points, no headers — just flowing text. Don't start with "Hey" or their name. Keep it under 200 words.`

  return prompt
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { logs, period, profile } = req.body

  if (!profile) {
    return res.status(400).json({ error: 'Missing profile data' })
  }

  try {
    const prompt = buildPrompt(logs, period || 'week', profile)

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const summary = message.content[0].text

    return res.status(200).json({ summary })
  } catch (error) {
    console.error('Claude API error:', error)
    return res.status(500).json({
      error: error.message || 'Failed to generate summary',
    })
  }
}
