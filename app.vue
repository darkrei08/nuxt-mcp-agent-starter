<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col items-center py-10">
    <div class="max-w-3xl w-full px-4 space-y-8">
      <header>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          MCP Agent Starter
        </h1>
        <p class="text-gray-400 mt-2">Chat with an LLM powered by Model Context Protocol (MCP) tools.</p>
      </header>

      <!-- Settings & MCP Catalog -->
      <section class="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">OpenAI API Key</label>
          <input v-model="apiKey" type="password" placeholder="sk-..." 
                 class="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none" />
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-300">Server MCP Attivi</label>
            <div class="flex gap-2">
              <button @click="showCustomCatalogForm = !showCustomCatalogForm" class="text-xs text-purple-400 hover:text-purple-300">+ Crea Preset</button>
              <button @click="activeMcpServers.push('')" class="text-xs text-blue-400 hover:text-blue-300">+ Aggiungi Manuale</button>
            </div>
          </div>

          <!-- Form Crea Preset -->
          <div v-if="showCustomCatalogForm" class="mb-4 p-3 bg-gray-800 border border-gray-700 rounded-lg space-y-2">
            <h4 class="text-xs font-semibold text-gray-300 mb-2">Nuovo Preset MCP</h4>
            <div class="grid grid-cols-2 gap-2">
              <input v-model="newCustomMcp.name" type="text" placeholder="Nome (es. Twitter)" class="p-2 bg-gray-950 border border-gray-700 rounded text-xs focus:border-purple-500 outline-none" />
              <input v-model="newCustomMcp.icon" type="text" placeholder="Icona (es. 🐦 o URL immagine)" class="p-2 bg-gray-950 border border-gray-700 rounded text-xs focus:border-purple-500 outline-none" />
              <input v-model="newCustomMcp.cmd" type="text" placeholder="Comando (es. npx -y @modelcontextprotocol/server-twitter)" class="col-span-2 p-2 bg-gray-950 border border-gray-700 rounded text-xs focus:border-purple-500 outline-none font-mono" />
            </div>
            <div class="flex justify-end pt-1">
              <button @click="saveCustomMcp" :disabled="!newCustomMcp.name || !newCustomMcp.cmd" class="text-xs bg-purple-600 text-white px-3 py-1.5 rounded disabled:opacity-50">Salva Preset</button>
            </div>
          </div>

          <!-- Catalogo Rapido -->
          <div class="flex flex-wrap gap-2 mb-4">
            <button v-for="mcp in [...mcpCatalog, ...customCatalog]" :key="mcp.name"
                    @click="addMcpServer(mcp.cmd)"
                    class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-800 border border-gray-700 hover:border-blue-500 transition-colors text-xs text-gray-400 hover:text-gray-200"
                    :title="mcp.desc || 'Preset personalizzato'">
              <img v-if="mcp.icon && mcp.icon.startsWith('http')" :src="mcp.icon" class="w-4 h-4 rounded-sm object-cover" />
              <span v-else>{{ mcp.icon }}</span>
              <span>{{ mcp.name }}</span>
            </button>
          </div>

          <!-- Server Attivi (Inputs) -->
          <div class="space-y-2">
            <div v-for="(server, idx) in activeMcpServers" :key="idx" class="flex gap-2">
              <input v-model="activeMcpServers[idx]" type="text" placeholder="es. npx -y @modelcontextprotocol/server-everything"
                     class="flex-1 bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none font-mono" />
              <button @click="activeMcpServers.splice(idx, 1)" class="p-3 text-red-400 hover:text-red-300 bg-gray-800 rounded-lg">
                ✕
              </button>
            </div>
            <p v-if="!activeMcpServers.length" class="text-xs text-gray-500">Nessun server MCP attivo.</p>
          </div>
        </div>
      </section>

      <!-- Chat -->
      <section class="bg-gray-900 rounded-xl border border-gray-800 flex flex-col h-[500px]">
        <div class="flex-1 p-6 overflow-y-auto space-y-4">
          <div v-for="(msg, i) in messages" :key="i" class="flex flex-col"
               :class="msg.role === 'user' ? 'items-end' : 'items-start'">
            <div class="max-w-[80%] rounded-xl p-4 text-sm whitespace-pre-wrap"
                 :class="msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200'">
              {{ msg.content }}
            </div>
          </div>
          <div v-if="loading" class="text-gray-500 text-sm italic">
            {{ typeof loading === 'string' ? loading : 'Agent is thinking...' }}
          </div>
        </div>
        
        <form @submit.prevent="sendMessage" class="p-4 border-t border-gray-800 flex gap-2">
          <input v-model="input" type="text" placeholder="Ask something..."
                 class="flex-1 bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none" />
          <button type="submit" :disabled="loading || !input"
                  class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-lg transition-colors">
            Send
          </button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const apiKey = ref('')
const activeMcpServers = ref<string[]>(['npx -y @modelcontextprotocol/server-everything'])
const input = ref('')
const messages = ref<{role: string, content: string}[]>([])
const loading = ref<string | boolean>(false)

// MCP Catalog Logic
const mcpCatalog = [
  { name: 'Brave Search', cmd: 'npx -y @modelcontextprotocol/server-brave-search', desc: 'Ricerca Web', icon: '🔍' },
  { name: 'GitHub', cmd: 'npx -y @modelcontextprotocol/server-github', desc: 'Gestione Repository', icon: '🐙' },
  { name: 'File System', cmd: 'npx -y @modelcontextprotocol/server-filesystem /', desc: 'Accesso ai file locali', icon: '📁' },
  { name: 'SQLite', cmd: 'npx -y @modelcontextprotocol/server-sqlite --db /path/to/db', desc: 'Database SQL', icon: '🗄️' },
  { name: 'PostgreSQL', cmd: 'npx -y @modelcontextprotocol/server-postgres postgres://localhost/db', desc: 'Database PostgreSQL', icon: '🐘' },
  { name: 'Puppeteer', cmd: 'npx -y @modelcontextprotocol/server-puppeteer', desc: 'Automazione Browser', icon: '🌐' },
  { name: 'Google Drive', cmd: 'npx -y @modelcontextprotocol/server-gdrive', desc: 'Google Drive API', icon: '📂' },
  { name: 'Slack', cmd: 'npx -y @modelcontextprotocol/server-slack', desc: 'Slack API', icon: '💬' },
  { name: 'Notion', cmd: 'npx -y @modelcontextprotocol/server-notion', desc: 'Notion API', icon: '📝' },
  { name: 'Sentry', cmd: 'npx -y @modelcontextprotocol/server-sentry', desc: 'Sentry Error Tracking', icon: '🐛' },
  { name: 'Memory', cmd: 'npx -y @modelcontextprotocol/server-memory', desc: 'Agent Memory System', icon: '🧠' },
  { name: 'Sequential', cmd: 'npx -y @modelcontextprotocol/server-sequential-thinking', desc: 'Sequential Thinking logic', icon: '⚙️' },
  { name: 'Twitter / X', cmd: 'npx -y @modelcontextprotocol/server-twitter', desc: 'Social Provider API', icon: '🐦' },
  { name: 'Facebook', cmd: 'npx -y @modelcontextprotocol/server-facebook', desc: 'Social Provider API', icon: '📘' }
]

const customCatalog = ref<{ name: string, icon: string, cmd: string, desc?: string }[]>([])
const showCustomCatalogForm = ref(false)
const newCustomMcp = ref({ name: '', icon: '', cmd: '' })

// Try to load custom catalog from localStorage if available (client-side only)
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('customMcpCatalog')
  if (saved) {
    try { customCatalog.value = JSON.parse(saved) } catch (e) {}
  }
}

watch(customCatalog, (val) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('customMcpCatalog', JSON.stringify(val))
  }
}, { deep: true })

function saveCustomMcp() {
  if (!newCustomMcp.value.name || !newCustomMcp.value.cmd) return
  customCatalog.value.push({ ...newCustomMcp.value })
  newCustomMcp.value = { name: '', icon: '', cmd: '' }
  showCustomCatalogForm.value = false
}

function addMcpServer(cmd: string) {
  if (!activeMcpServers.value.includes(cmd)) {
    activeMcpServers.value.push(cmd)
  }
}

async function sendMessage() {
  if (!input.value.trim() || loading.value) return
  
  messages.value.push({ role: 'user', content: input.value })
  const userMsg = input.value
  input.value = ''
  loading.value = true
  
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: userMsg,
        apiKey: apiKey.value,
        mcpServers: activeMcpServers.value.filter(s => s.trim())
      })
    })
    
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    
    if (reader) {
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'progress') {
                loading.value = data.msg
              } else if (data.type === 'complete') {
                messages.value.push({ role: 'assistant', content: data.result })
              } else if (data.type === 'error') {
                messages.value.push({ role: 'assistant', content: `Error: ${data.error}` })
              }
            } catch (e) {
              // Ignore malformed JSON in stream chunks
            }
          }
        }
      }
    }
  } catch (err: any) {
    messages.value.push({ role: 'assistant', content: `Error: ${err.message}` })
  } finally {
    loading.value = false
  }
}
</script>
