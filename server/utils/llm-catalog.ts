/**
 * LLM Catalog — Dynamic model fetching from provider APIs + OpenRouter + HuggingFace.
 *
 * Architecture:
 *  1. OpenRouter (primary)   — All frontier models, no auth needed for listing
 *  2. HuggingFace (trending) — Open-source trending models
 *  3. Provider direct APIs   — OpenAI, Anthropic, Gemini, Cohere (require API keys)
 *  4. Hardcoded fallback     — When all fetches fail
 *
 * Cache: in-memory Map with 24h TTL per provider key.
 */

import type { LlmModelEntry, ModelCategory } from '~/lib/llm-models'
import { LLM_MODELS as FALLBACK_MODELS } from '~/lib/llm-models'

// ── Cache ─────────────────────────────────────────────────────────────────────

interface CacheEntry {
  data: LlmModelEntry[]
  expiry: number
}

const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const cache = new Map<string, CacheEntry>()

function getCached(key: string): LlmModelEntry[] | null {
  const entry = cache.get(key)
  if (entry && Date.now() < entry.expiry) return entry.data
  cache.delete(key)
  return null
}

function setCache(key: string, data: LlmModelEntry[]): void {
  cache.set(key, { data, expiry: Date.now() + TTL_MS })
}

export function invalidateCache(key?: string): void {
  if (key) cache.delete(key)
  else cache.clear()
}

// ── Classification Heuristics ─────────────────────────────────────────────────

/** Known model-id substrings → category */
const CATEGORY_RULES: { pattern: RegExp; category: ModelCategory }[] = [
  // Thinking / Reasoning — order matters, more specific first
  { pattern: /\b(o1|o3|o4|opus|thinking|reason|deep-?think)\b/i,  category: 'thinking' },
  { pattern: /\bpro\b(?!.*mini)/i,                                  category: 'thinking' },
  { pattern: /\bcommand-r-plus/i,                                   category: 'thinking' },

  // Vision / Multimodal
  { pattern: /\b(vision|4o(?!-mini)|pixtral|llava|visual)\b/i,      category: 'vision' },

  // Code
  { pattern: /\b(code|sonnet|codestral|starcoder|deepseek-coder|qwen.*coder|codegemma)\b/i, category: 'code' },

  // Fast / Cheap — catch-all for small/fast models
  { pattern: /\b(mini|nano|flash|haiku|lite|instant|small|tiny|turbo)\b/i, category: 'fast' },
]

function classifyModel(id: string, name?: string): ModelCategory {
  const text = `${id} ${name || ''}`.toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) return rule.category
  }
  return 'fast' // default for unclassified
}

// ── Provider Name Normalisation ───────────────────────────────────────────────

function normaliseProvider(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('openai') || lower === 'system') return 'openai'
  if (lower.includes('anthropic') || lower.includes('claude')) return 'anthropic'
  if (lower.includes('google') || lower.includes('gemini')) return 'gemini'
  if (lower.includes('cohere')) return 'cohere'
  if (lower.includes('meta') || lower.includes('llama')) return 'meta'
  if (lower.includes('mistral')) return 'mistral'
  if (lower.includes('deepseek')) return 'deepseek'
  if (lower.includes('qwen')) return 'qwen'
  return lower.split('/')[0] || lower
}

// ── Model ID Filters (skip non-chat models) ──────────────────────────────────

const SKIP_PATTERNS = [
  /^(dall-e|tts|whisper|text-embedding|text-moderation|text-search|text-similarity)/i,
  /^(babbage|davinci|curie|ada)(?!.*chat)/i,
  /\b(embed|rerank|moderate|classify|detect|segment|summarize)\b/i,
  /^ft:/i, // fine-tuned user models
]

function shouldSkip(id: string): boolean {
  return SKIP_PATTERNS.some(p => p.test(id))
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

/** Fetch from OpenRouter — no auth required, returns all frontier models */
async function fetchOpenRouter(): Promise<LlmModelEntry[]> {
  const cached = getCached('openrouter')
  if (cached) return cached

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models')
    if (!res.ok) return []
    const json = await res.json()
    const models: LlmModelEntry[] = []

    for (const m of (json.data || [])) {
      const id: string = m.id || ''
      if (!id || shouldSkip(id.split('/').pop() || id)) continue

      // OpenRouter ids are "provider/model" e.g. "openai/gpt-4o"
      const parts = id.split('/')
      const provider = normaliseProvider(parts[0] || '')
      const modelSlug = parts.slice(1).join('/') || id

      models.push({
        id: modelSlug,
        name: m.name || modelSlug,
        provider,
        category: classifyModel(modelSlug, m.name),
      })
    }

    // Deduplicate by id+provider
    const seen = new Set<string>()
    const deduped = models.filter(m => {
      const key = `${m.provider}:${m.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    setCache('openrouter', deduped)
    return deduped
  } catch (e) {
    console.warn('[LLM Catalog] OpenRouter fetch failed:', (e as Error).message)
    return []
  }
}

/** Fetch trending text-generation models from HuggingFace */
async function fetchHuggingFace(): Promise<LlmModelEntry[]> {
  const cached = getCached('huggingface')
  if (cached) return cached

  try {
    const res = await fetch(
      'https://huggingface.co/api/models?pipeline_tag=text-generation&sort=trending&direction=-1&limit=30'
    )
    if (!res.ok) return []
    const json = await res.json()
    const models: LlmModelEntry[] = []

    for (const m of (json || [])) {
      const fullId: string = m.modelId || m.id || ''
      if (!fullId) continue

      // HuggingFace ids are "org/model" e.g. "meta-llama/Llama-3.1-8B-Instruct"
      const parts = fullId.split('/')
      const org = parts[0] || ''
      const modelName = parts.slice(1).join('/') || fullId
      const provider = normaliseProvider(org)

      models.push({
        id: fullId, // keep full id for HF inference
        name: modelName.replace(/-/g, ' '),
        provider,
        category: classifyModel(fullId, modelName),
      })
    }

    setCache('huggingface', models)
    return models
  } catch (e) {
    console.warn('[LLM Catalog] HuggingFace fetch failed:', (e as Error).message)
    return []
  }
}

/** Fetch from a specific provider's direct API */
async function fetchProviderDirect(
  provider: string,
  apiKey: string,
  baseUrl?: string
): Promise<LlmModelEntry[]> {
  const cacheKey = `direct:${provider}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    let url = ''
    const headers: Record<string, string> = {}

    switch (provider) {
      case 'openai':
        url = `${baseUrl || 'https://api.openai.com/v1'}/models`
        headers['Authorization'] = `Bearer ${apiKey}`
        break
      case 'anthropic':
        url = 'https://api.anthropic.com/v1/models'
        headers['x-api-key'] = apiKey
        headers['anthropic-version'] = '2023-06-01'
        break
      case 'gemini':
        url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        break
      case 'cohere':
        url = 'https://api.cohere.com/v1/models'
        headers['Authorization'] = `Bearer ${apiKey}`
        break
      default:
        return []
    }

    const res = await fetch(url, { headers })
    if (!res.ok) return []
    const json = await res.json()

    const models: LlmModelEntry[] = []

    if (provider === 'openai') {
      for (const m of (json.data || [])) {
        const id = m.id || ''
        if (shouldSkip(id)) continue
        if (m.owned_by && m.owned_by !== 'openai' && m.owned_by !== 'system') continue
        models.push({
          id,
          name: id,
          provider: 'openai',
          category: classifyModel(id),
        })
      }
    } else if (provider === 'anthropic') {
      for (const m of (json.data || [])) {
        models.push({
          id: m.id || '',
          name: m.display_name || m.id || '',
          provider: 'anthropic',
          category: classifyModel(m.id || '', m.display_name),
        })
      }
    } else if (provider === 'gemini') {
      for (const m of (json.models || [])) {
        const id = (m.name || '').replace(/^models\//, '')
        if (!id || shouldSkip(id)) continue
        models.push({
          id,
          name: m.displayName || id,
          provider: 'gemini',
          category: classifyModel(id, m.displayName),
        })
      }
    } else if (provider === 'cohere') {
      for (const m of (json.models || [])) {
        if (m.is_deprecated) continue
        const endpoints: string[] = m.endpoints || []
        if (!endpoints.includes('chat')) continue
        models.push({
          id: m.name || '',
          name: m.name || '',
          provider: 'cohere',
          category: classifyModel(m.name || ''),
        })
      }
    }

    setCache(cacheKey, models)
    return models
  } catch (e) {
    console.warn(`[LLM Catalog] ${provider} direct fetch failed:`, (e as Error).message)
    return []
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface CatalogResult {
  models: LlmModelEntry[]
  sources: string[] // which sources provided data
  cached: boolean
}

/**
 * Fetch the combined LLM model catalog.
 *
 * @param providerFilter  Optional: only return models for this provider
 * @param apiKeys         Map of provider → apiKey for direct API fetches
 * @param forceRefresh    If true, invalidate cache first
 */
export async function fetchModelCatalog(opts: {
  providerFilter?: string
  apiKeys?: Record<string, string>
  forceRefresh?: boolean
}): Promise<CatalogResult> {
  if (opts.forceRefresh) invalidateCache()

  const sources: string[] = []
  const allModels: LlmModelEntry[] = []

  // 1. Fetch from OpenRouter (all frontier models, no auth)
  const openRouterModels = await fetchOpenRouter()
  if (openRouterModels.length > 0) {
    sources.push('openrouter')
    allModels.push(...openRouterModels)
  }

  // 2. Fetch trending from HuggingFace
  const hfModels = await fetchHuggingFace()
  if (hfModels.length > 0) {
    sources.push('huggingface')
    allModels.push(...hfModels)
  }

  // 3. Fetch from provider direct APIs if keys are provided
  const apiKeys = opts.apiKeys || {}
  const directFetches = Object.entries(apiKeys)
    .filter(([, key]) => !!key)
    .map(async ([provider, key]) => {
      const models = await fetchProviderDirect(provider, key)
      if (models.length > 0) {
        sources.push(`direct:${provider}`)
        allModels.push(...models)
      }
    })
  await Promise.all(directFetches)

  // 4. Deduplicate: prefer direct > openrouter > huggingface
  const seen = new Map<string, LlmModelEntry>()
  for (const m of allModels) {
    const key = `${m.provider}:${m.id}`
    // Later entries (direct API) overwrite earlier ones (openrouter)
    seen.set(key, m)
  }
  let merged = Array.from(seen.values())

  // 5. Filter by provider if requested
  if (opts.providerFilter && opts.providerFilter !== 'custom') {
    merged = merged.filter(m => m.provider === opts.providerFilter)
  }

  // 6. Fallback to hardcoded if nothing came back
  if (merged.length === 0) {
    sources.push('fallback')
    const fallback = opts.providerFilter
      ? FALLBACK_MODELS.filter(m => m.provider === opts.providerFilter)
      : [...FALLBACK_MODELS]
    return { models: fallback, sources, cached: false }
  }

  // 7. Sort: by provider, then by category priority, then by name
  const catOrder: Record<ModelCategory, number> = { thinking: 0, code: 1, vision: 2, fast: 3 }
  merged.sort((a, b) => {
    if (a.provider !== b.provider) return a.provider.localeCompare(b.provider)
    const ca = catOrder[a.category] ?? 9
    const cb = catOrder[b.category] ?? 9
    if (ca !== cb) return ca - cb
    return a.name.localeCompare(b.name)
  })

  return { models: merged, sources, cached: sources.length > 0 }
}
