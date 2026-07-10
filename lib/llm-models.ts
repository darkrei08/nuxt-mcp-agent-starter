/**
 * LLM Models Catalog — Types, fallback registry, and client-side fetch.
 *
 * The hardcoded list is used ONLY as a fallback when the dynamic catalog
 * (OpenRouter + HuggingFace + provider APIs) is unavailable.
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
  thinking: { label: 'Thinking / Reasoning', icon: '🧠', description: 'Ragionamento avanzato (CoT)' },
  fast:     { label: 'Fast / Chat',          icon: '⚡', description: 'Veloce e low-cost' },
  code:     { label: 'Code',                 icon: '💻', description: 'Ottimizzato per codice' },
  vision:   { label: 'Vision',               icon: '👁️', description: 'Multimodale con immagini' },
}

// ── Hardcoded Fallback (used when dynamic fetch fails) ────────────────────────

export const LLM_MODELS: LlmModelEntry[] = [
  // ── OpenAI ──────────────────────────────────────
  { id: 'o3',              name: 'o3',                provider: 'openai',    category: 'thinking' },
  { id: 'o4-mini',         name: 'o4-mini',           provider: 'openai',    category: 'thinking' },
  { id: 'gpt-4.1',         name: 'GPT-4.1',           provider: 'openai',    category: 'code' },
  { id: 'gpt-4.1-mini',    name: 'GPT-4.1 Mini',      provider: 'openai',    category: 'fast' },
  { id: 'gpt-4.1-nano',    name: 'GPT-4.1 Nano',      provider: 'openai',    category: 'fast' },
  { id: 'gpt-4o',          name: 'GPT-4o',             provider: 'openai',    category: 'vision' },
  { id: 'gpt-4o-mini',     name: 'GPT-4o Mini',        provider: 'openai',    category: 'fast' },

  // ── Anthropic ───────────────────────────────────
  { id: 'claude-opus-4',       name: 'Claude Opus 4',       provider: 'anthropic', category: 'thinking' },
  { id: 'claude-sonnet-4',     name: 'Claude Sonnet 4',     provider: 'anthropic', category: 'code' },
  { id: 'claude-3.5-haiku',    name: 'Claude 3.5 Haiku',    provider: 'anthropic', category: 'fast' },

  // ── Google Gemini ───────────────────────────────
  { id: 'gemini-3.5-pro',      name: 'Gemini 3.5 Pro',      provider: 'gemini',    category: 'thinking' },
  { id: 'gemini-3.1-pro',      name: 'Gemini 3.1 Pro',      provider: 'gemini',    category: 'thinking' },
  { id: 'gemini-2.5-pro',      name: 'Gemini 2.5 Pro',      provider: 'gemini',    category: 'thinking' },
  { id: 'gemini-2.5-flash',    name: 'Gemini 2.5 Flash',    provider: 'gemini',    category: 'fast' },
  { id: 'gemini-2.0-flash',    name: 'Gemini 2.0 Flash',    provider: 'gemini',    category: 'fast' },

  // ── Cohere ──────────────────────────────────────
  { id: 'command-r-plus',      name: 'Command R+',          provider: 'cohere',    category: 'thinking' },
  { id: 'command-r',           name: 'Command R',           provider: 'cohere',    category: 'fast' },
  { id: 'command-a',           name: 'Command A',           provider: 'cohere',    category: 'code' },

  // ── Meta ────────────────────────────────────────
  { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', provider: 'meta', category: 'thinking' },

  // ── Mistral ─────────────────────────────────────
  { id: 'mistral-large-latest', name: 'Mistral Large',      provider: 'mistral',   category: 'thinking' },
  { id: 'codestral-latest',     name: 'Codestral',          provider: 'mistral',   category: 'code' },

  // ── DeepSeek ────────────────────────────────────
  { id: 'deepseek-v4',          name: 'DeepSeek V4',        provider: 'deepseek',  category: 'thinking' },
  { id: 'deepseek-chat',        name: 'DeepSeek V3',        provider: 'deepseek',  category: 'fast' },
  { id: 'deepseek-reasoner',    name: 'DeepSeek R1',        provider: 'deepseek',  category: 'thinking' },
]

// ── Client-Side Helpers ───────────────────────────────────────────────────────

/** Get fallback models filtered by provider */
export function getModelsForProvider(provider: string): LlmModelEntry[] {
  return LLM_MODELS.filter(m => m.provider === provider)
}

/** Get all fallback models grouped by category */
export function getAllModelsByCategory(): Record<ModelCategory, LlmModelEntry[]> {
  const result: Record<ModelCategory, LlmModelEntry[]> = {
    thinking: [], fast: [], code: [], vision: [],
  }
  for (const m of LLM_MODELS) {
    result[m.category].push(m)
  }
  return result
}

/** Get models grouped by category for a provider */
export function getModelsGroupedByCategory(
  provider: string,
  dynamicModels?: LlmModelEntry[]
): { category: ModelCategory; label: string; icon: string; models: LlmModelEntry[] }[] {
  const source = dynamicModels && dynamicModels.length > 0 ? dynamicModels : LLM_MODELS
  const providerModels = source.filter(m => m.provider === provider)
  const groups: { category: ModelCategory; label: string; icon: string; models: LlmModelEntry[] }[] = []

  for (const [cat, meta] of Object.entries(MODEL_CATEGORIES)) {
    const models = providerModels.filter(m => m.category === cat)
    if (models.length > 0) {
      groups.push({ category: cat as ModelCategory, label: meta.label, icon: meta.icon, models })
    }
  }
  return groups
}

/** Get unique provider names from a models list */
export function getProviders(dynamicModels?: LlmModelEntry[]): string[] {
  const source = dynamicModels && dynamicModels.length > 0 ? dynamicModels : LLM_MODELS
  return [...new Set(source.map(m => m.provider))].sort()
}
