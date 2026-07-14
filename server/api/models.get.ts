import { defineEventHandler, getQuery } from 'h3'
import { fetchModelCatalog } from '~/server/utils/llm-catalog'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const forceRefresh = query.force === '1' || query.refresh === '1'
  const providerFilter = (query.provider as string) || undefined

  const apiKeys: Record<string, string> = {}

  // Map environment variable keys if available
  if (process.env.OPENAI_API_KEY) apiKeys.openai = process.env.OPENAI_API_KEY
  if (process.env.ANTHROPIC_API_KEY) apiKeys.anthropic = process.env.ANTHROPIC_API_KEY
  if (process.env.GEMINI_API_KEY) apiKeys.gemini = process.env.GEMINI_API_KEY
  if (query.apiKey && typeof query.apiKey === 'string' && providerFilter) {
    apiKeys[providerFilter] = query.apiKey
  }

  const result = await fetchModelCatalog({
    forceRefresh,
  })

  return {
    data: result.models,
    sources: result.sources,
    total: result.models.length,
  }
})
