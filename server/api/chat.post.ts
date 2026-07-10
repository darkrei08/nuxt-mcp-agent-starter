import { defineEventHandler, readBody, createError, setResponseHeader } from 'h3'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

export default defineEventHandler(async (event) => {
  const { prompt, apiKey, mcpServers, provider, model, customBaseUrl } = await readBody(event)

  if (!apiKey && provider !== 'custom') {
    throw createError({ statusCode: 400, statusMessage: 'API Key mancante per il provider selezionato' })
  }

  // Setup SSE Headers
  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')
  // We must return a promise that resolves when the stream is done, but we can write directly to event.node.res
  const res = event.node.res
  const sendEvent = (type: string, data: any) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`)
  }

  let baseURL = 'https://api.openai.com/v1'
  if (provider === 'custom' && customBaseUrl) {
    baseURL = customBaseUrl.replace(/\/+$/, '')
  } else if (provider === 'anthropic') {
    // Anthropic usually uses a different endpoint structure, 
    // but assuming OpenAI-compatible endpoints or OpenRouter if they use standard openai format
    // For a real implementation, we should use their specific SDK or format
    baseURL = 'https://openrouter.ai/api/v1'
  } else if (provider === 'gemini') {
    baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai'
  } else if (provider === 'deepseek') {
    baseURL = 'https://api.deepseek.com'
  } else if (provider === 'mistral') {
    baseURL = 'https://api.mistral.ai/v1'
  } else if (provider === 'groq') {
    baseURL = 'https://api.groq.com/openai/v1'
  } else if (provider === 'cohere') {
    baseURL = 'https://api.cohere.com/v1'
  } else if (provider === 'openrouter' || (provider && provider !== 'openai' && provider !== 'custom')) {
    baseURL = 'https://openrouter.ai/api/v1'
  }
  
  const selectedModel = model || 'gpt-4o-mini'

  const messages = [
    { role: 'system', content: 'Sei un assistente IA potenziato con tool MCP (Model Context Protocol). Usa i tool forniti se necessario per rispondere alle domande dell\'utente.' },
    { role: 'user', content: prompt }
  ]

  let availableTools: any[] = []
  const mcpClients: { client: Client, transport: StdioClientTransport, serverName: string }[] = []

  try {
    sendEvent('progress', { msg: 'Inizializzazione server MCP...' })

    // 1. Initialize MCP Clients
    for (const cmd of (mcpServers || [])) {
      if (!cmd.trim()) continue
      const args = cmd.split(' ')
      const command = args.shift()!
      
      const transport = new StdioClientTransport({
        command,
        args,
        env: process.env
      })
      
      const client = new Client(
        { name: 'nuxt-mcp-agent', version: '1.0.0' },
        {
          capabilities: {
            roots: { listChanged: false },
            sampling: {}
          }
        }
      )

      // Roots capability
      client.setRequestHandler({ method: 'roots/list' } as any, async () => {
        return {
          roots: [
            {
              uri: `file://${process.cwd()}`,
              name: 'Workspace corrente'
            }
          ]
        }
      })

      // Sampling capability
      client.setRequestHandler({ method: 'sampling/createMessage' } as any, async (req: any) => {
        sendEvent('progress', { msg: `Il server MCP richiede un sampling (LLM Inception)...` })
        const samplingRes = await fetch(`${baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: req.params.modelPreferences?.hints?.[0]?.name || selectedModel,
            messages: req.params.messages,
            max_tokens: req.params.maxTokens || 1000
          })
        })
        const samplingData = await samplingRes.json()
        return {
          role: samplingData.choices[0].message.role,
          content: { type: 'text', text: samplingData.choices[0].message.content },
          model: samplingData.model
        }
      })

      await client.connect(transport)
      const toolsRes = await client.listTools()
      
      for (const t of toolsRes.tools) {
        availableTools.push({
          type: 'function',
          function: {
            name: `${command}_${t.name}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
            description: t.description,
            parameters: t.inputSchema
          },
          _mcpClient: client,
          _originalName: t.name
        })
      }
      mcpClients.push({ client, transport, serverName: command })
    }

    // 2. Agent Chat Loop
    let maxIterations = 5
    let currentIteration = 0
    let finalContent = ''

    sendEvent('progress', { msg: 'Elaborazione della risposta (LLM)...' })

    while (currentIteration < maxIterations) {
      currentIteration++
      
      const payload: any = {
        model: selectedModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      }
      
      if (availableTools.length > 0) {
        payload.tools = availableTools.map(t => ({ type: 'function', function: t.function }))
      }

      const fetchRes = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      })

      if (!fetchRes.ok) {
        const errText = await fetchRes.text()
        throw new Error(`LLM API Error: ${errText}`)
      }

      const data = await fetchRes.json()
      const message = data.choices[0].message
      
      messages.push(message)
      
      if (message.tool_calls && message.tool_calls.length > 0) {
        // Execute tools
        for (const call of message.tool_calls) {
          const fnName = call.function.name
          const args = JSON.parse(call.function.arguments || '{}')
          
          sendEvent('progress', { msg: `Esecuzione tool: ${fnName}...` })
          
          const toolConfig = availableTools.find(t => t.function.name === fnName)
          if (toolConfig) {
            try {
              const result = await toolConfig._mcpClient.callTool({
                name: toolConfig._originalName,
                arguments: args
              })
              messages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: JSON.stringify(result)
              })
            } catch (e: any) {
              messages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: `Error: ${e.message}`
              })
            }
          } else {
            messages.push({
              role: 'tool',
              tool_call_id: call.id,
              content: `Tool ${fnName} not found.`
            })
          }
        }
        sendEvent('progress', { msg: 'Analisi dei risultati del tool...' })
        continue // Loop back to LLM
      } else {
        finalContent = message.content
        break
      }
    }

    sendEvent('complete', { result: finalContent })
  } catch (err: any) {
    sendEvent('error', { error: err.message || 'Errore Server' })
  } finally {
    // Cleanup MCP processes
    for (const c of mcpClients) {
      try {
        await c.client.close()
      } catch (e) {}
    }
    res.end()
  }
})
