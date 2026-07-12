/**
 * LLM Models Catalog — Types, fallback registry, and client-side fetch.
 *
 * Guaranteed inclusion of all frontier models seen on provider Web Apps / Interfaces
 * (ChatGPT, Claude.ai, Google AI Studio, Cohere Platform, DeepSeek Web).
 *
 * Categories:
 *  - thinking : Deep reasoning / Chain-of-Thought models
 *  - fast     : Low latency, cost-efficient models
 *  - code     : Optimised for code generation / editing
 *  - vision   : Multimodal models with image understanding
 */

export type ModelCategory = 'thinking' | 'fast' | 'code' | 'vision'

export interface LlmModelEntry {
  id: string
  name: string
  provider: string
  category: ModelCategory
}

export const MODEL_CATEGORIES: Record<ModelCategory, { label: string; icon: string; description: string }> = {
  thinking: { label: 'Thinking / Reasoning (Frontier)', icon: '🧠', description: 'Ragionamento avanzato (CoT / Frontier)' },
  fast:     { label: 'Fast / Chat & Instant',            icon: '⚡', description: 'Veloce, reattivo e low-cost' },
  code:     { label: 'Code & Software Engineering',      icon: '💻', description: 'Ottimizzato per codice e architettura' },
  vision:   { label: 'Vision & Multimodal',              icon: '👁️', description: 'Analisi visuale e multimodale' },
}

// ── Curated Frontier Models (Web App & API Latest) ───────────────────────────

export const LLM_MODELS: LlmModelEntry[] = [
  // ── OpenAI (ChatGPT Web & API Frontier) ─────────────────────────
  { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview (Frontier)', provider: 'openai', category: 'thinking' },
  { id: 'o3',              name: 'o3 Reasoning Frontier',       provider: 'openai', category: 'thinking' },
  { id: 'o3-mini',         name: 'o3-mini High Reasoning',      provider: 'openai', category: 'thinking' },
  { id: 'o1',              name: 'o1 Reasoning',                provider: 'openai', category: 'thinking' },
  { id: 'o4-mini',         name: 'o4-mini Reasoning',           provider: 'openai', category: 'thinking' },
  { id: 'gpt-4o',          name: 'GPT-4o Omnimodal',            provider: 'openai', category: 'vision' },
  { id: 'gpt-4.1',         name: 'GPT-4.1 Code Specialist',     provider: 'openai', category: 'code' },
  { id: 'gpt-4o-mini',     name: 'GPT-4o Mini',                 provider: 'openai', category: 'fast' },
  { id: 'gpt-4.1-mini',    name: 'GPT-4.1 Mini',                provider: 'openai', category: 'fast' },
  { id: 'gpt-4.1-nano',    name: 'GPT-4.1 Nano Ultra-Fast',     provider: 'openai', category: 'fast' },

  // ── Anthropic (Claude.ai Web & API Frontier) ────────────────────
  { id: 'claude-3-7-sonnet-latest', name: 'Claude 3.7 Sonnet (Hybrid Reasoning)', provider: 'anthropic', category: 'thinking' },
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet v2',                 provider: 'anthropic', category: 'code' },
  { id: 'claude-3-opus-latest',     name: 'Claude 3 Opus Frontier',               provider: 'anthropic', category: 'thinking' },
  { id: 'claude-3-5-haiku-latest',  name: 'Claude 3.5 Haiku Instant',             provider: 'anthropic', category: 'fast' },
  { id: 'claude-opus-4',            name: 'Claude Opus 4 Preview',                provider: 'anthropic', category: 'thinking' },
  { id: 'claude-sonnet-4',          name: 'Claude Sonnet 4 Preview',              provider: 'anthropic', category: 'code' },

  // ── Google Gemini (AI Studio Web & API Frontier) ────────────────
  { id: 'gemini-3.5-pro',           name: 'Gemini 3.5 Pro Advanced',              provider: 'gemini',    category: 'thinking' },
  { id: 'gemini-3.5-flash',         name: 'Gemini 3.5 Flash',                     provider: 'gemini',    category: 'fast' },
  { id: 'gemini-3.1-pro-preview',   name: 'Gemini 3.1 Pro Preview',               provider: 'gemini',    category: 'thinking' },
  { id: 'gemini-3.1-flash-lite',    name: 'Gemini 3.1 Flash Lite',                provider: 'gemini',    category: 'fast' },
  { id: 'gemini-3.0-pro-preview',   name: 'Gemini 3.0 Pro Preview',               provider: 'gemini',    category: 'thinking' },
  { id: 'gemini-3.0-flash-preview', name: 'Gemini 3.0 Flash Preview',             provider: 'gemini',    category: 'fast' },
  { id: 'gemini-2.5-pro',           name: 'Gemini 2.5 Pro Advanced Reasoning',    provider: 'gemini',    category: 'thinking' },
  { id: 'gemini-2.5-flash',         name: 'Gemini 2.5 Flash Ultra-Fast',          provider: 'gemini',    category: 'fast' },
  { id: 'gemini-2.0-flash',         name: 'Gemini 2.0 Flash',                     provider: 'gemini',    category: 'fast' },

  // ── Cohere (Platform & API) ─────────────────────────────────────
  { id: 'command-r-plus',           name: 'Command R+ Frontier',                  provider: 'cohere',    category: 'thinking' },
  { id: 'command-r',                name: 'Command R',                            provider: 'cohere',    category: 'fast' },
  { id: 'command-a',                name: 'Command A Code Specialist',            provider: 'cohere',    category: 'code' },

  // ── Meta Llama ──────────────────────────────────────────────────
  { id: 'meta-llama/Llama-3.3-70B-Instruct',  name: 'Llama 3.3 70B Instruct',     provider: 'meta',      category: 'thinking' },
  { id: 'meta-llama/Llama-3.1-405B-Instruct', name: 'Llama 3.1 405B Frontier',    provider: 'meta',      category: 'thinking' },

  // ── Mistral ─────────────────────────────────────────────────────
  { id: 'mistral-large-latest',     name: 'Mistral Large 2',                      provider: 'mistral',   category: 'thinking' },
  { id: 'codestral-latest',         name: 'Codestral 2501 Specialist',            provider: 'mistral',   category: 'code' },

  // ── DeepSeek (DeepSeek Web & API) ───────────────────────────────
  { id: 'deepseek-reasoner',        name: 'DeepSeek R1 Reasoning Frontier',       provider: 'deepseek',  category: 'thinking' },
  { id: 'deepseek-chat',            name: 'DeepSeek V3 Frontier',                 provider: 'deepseek',  category: 'fast' },
  { id: 'deepseek-v4',              name: 'DeepSeek V4 Preview',                  provider: 'deepseek',  category: 'thinking' },
]

// ── Helper: Always merge frontier models with dynamic scraper list ────────────

export function mergeModelsWithFallback(dynamicModels?: LlmModelEntry[]): LlmModelEntry[] {
  const map = new Map<string, LlmModelEntry>()
  // First insert all curated frontier models to guarantee availability with clean names
  for (const m of LLM_MODELS) {
    map.set(`${m.provider}:${m.id}`, m)
  }
  // Then overlay dynamically scraped models
  if (dynamicModels) {
    for (const m of dynamicModels) {
      const key = `${m.provider}:${m.id}`
      if (!map.has(key)) {
        map.set(key, m)
      }
    }
  }
  return Array.from(map.values())
}

// ── Client-Side Helpers ───────────────────────────────────────────────────────

/** Get models filtered by provider (always including official frontier models) */
export function getModelsForProvider(provider: string, dynamicModels?: LlmModelEntry[]): LlmModelEntry[] {
  const all = mergeModelsWithFallback(dynamicModels)
  return all.filter(m => m.provider === provider)
}

/** Get all models grouped by category */
export function getAllModelsByCategory(dynamicModels?: LlmModelEntry[]): Record<ModelCategory, LlmModelEntry[]> {
  const all = mergeModelsWithFallback(dynamicModels)
  const result: Record<ModelCategory, LlmModelEntry[]> = {
    thinking: [], fast: [], code: [], vision: [],
  }
  for (const m of all) {
    result[m.category].push(m)
  }
  return result
}

/** Get models grouped by category for a specific provider */
export function getModelsGroupedByCategory(
  provider: string,
  dynamicModels?: LlmModelEntry[]
): { category: ModelCategory; label: string; icon: string; models: LlmModelEntry[] }[] {
  const all = mergeModelsWithFallback(dynamicModels)
  const providerModels = all.filter(m => m.provider === provider)
  const groups: { category: ModelCategory; label: string; icon: string; models: LlmModelEntry[] }[] = []

  for (const [cat, meta] of Object.entries(MODEL_CATEGORIES)) {
    const models = providerModels.filter(m => m.category === cat)
    if (models.length > 0) {
      groups.push({ category: cat as ModelCategory, label: meta.label, icon: meta.icon, models })
    }
  }
  return groups
}

/** Get unique provider names from the combined models catalog */
export function getProviders(dynamicModels?: LlmModelEntry[]): string[] {
  const all = mergeModelsWithFallback(dynamicModels)
  return [...new Set(all.map(m => m.provider))].sort()
}
