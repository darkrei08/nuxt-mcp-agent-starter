import { defineEventHandler, getQuery } from 'h3'
import { fetchModelCatalog } from '~/server/utils/llm-catalog'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const forceRefresh = query.force === '1'

  // Fetch from OpenRouter, HuggingFace, etc. (no direct API keys used in this starter endpoint by default)
  const result = await fetchModelCatalog({
    forceRefresh,
  })

  return {
    data: result.models,
    sources: result.sources,
    total: result.models.length,
  }
})
