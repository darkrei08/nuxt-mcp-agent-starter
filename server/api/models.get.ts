/**
 * GET /api/settings/llm-models — Dynamic LLM model catalog
 *
 * Query params:
 *   provider  - Filter by provider (optional)
 *   refresh   - "1" to force cache invalidation
 *   source    - "openrouter" | "huggingface" | "all" (default: "all")
 */

import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { fetchModelCatalog } from '~/server/utils/llm-catalog'

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId
  const query = getQuery(event)

  const providerFilter = (query.provider as string) || undefined
  const forceRefresh = query.refresh === '1'

  // Read stored API keys from team llmSettings (if any)
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { llmSettings: true }
  })

  const settings = (team?.llmSettings as Record<string, any>) || {}
  const apiKeys: Record<string, string> = {}

  // Map stored provider+apiKey for direct API fetches
  if (settings.apiKey && settings.provider && settings.provider !== 'custom') {
    apiKeys[settings.provider] = settings.apiKey
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
