import { defineEventHandler, getQuery } from 'h3'
import { fetchModelCatalog } from '~/server/utils/llm-catalog'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const providerFilter = (query.provider as string) || undefined
  const forceRefresh = query.refresh === '1'

  const apiKeys: Record<string, string> = {}

  // Map environment variable keys if available
  if (process.env.OPENAI_API_KEY) apiKeys.openai = process.env.OPENAI_API_KEY
  if (process.env.ANTHROPIC_API_KEY) apiKeys.anthropic = process.env.ANTHROPIC_API_KEY
  if (process.env.GEMINI_API_KEY) apiKeys.gemini = process.env.GEMINI_API_KEY
  if (query.apiKey && typeof query.apiKey === 'string' && providerFilter) {
    apiKeys[providerFilter] = query.apiKey
  }

  const result = await fetchModelCatalog({
    providerFilter,
    apiKeys,
    forceRefresh,
  })

  return {
    data: {
      models: result.models,
      sources: result.sources,
      total: result.models.length,
    }
  }
})
