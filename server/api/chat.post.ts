import { defineEventHandler, readBody, createError } from 'h3'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

export default defineEventHandler(async (event) => {
  const { prompt, apiKey, mcpServers } = await readBody(event)

  if (!apiKey) {
    throw createError({ statusCode: 400, statusMessage: 'OpenAI API Key mancante' })
  }

  const baseURL = 'https://api.openai.com/v1'
  const model = 'gpt-4o-mini' // or gpt-4o for better tool usage

  const messages = [
    { role: 'system', content: 'Sei un assistente IA potenziato con tool MCP (Model Context Protocol). Usa i tool forniti se necessario per rispondere alle domande dell\'utente.' },
    { role: 'user', content: prompt }
  ]

  let availableTools: any[] = []
  const mcpClients: { client: Client, transport: StdioClientTransport, serverName: string }[] = []

  try {
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
      
      const client = new Client({ name: 'nuxt-mcp-agent', version: '1.0.0' }, { capabilities: {} })
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

    while (currentIteration < maxIterations) {
      currentIteration++
      
      const payload: any = {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      }
      
      if (availableTools.length > 0) {
        payload.tools = availableTools.map(t => ({ type: 'function', function: t.function }))
      }

      const res = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`LLM API Error: ${errText}`)
      }

      const data = await res.json()
      const message = data.choices[0].message
      
      messages.push(message)
      
      if (message.tool_calls && message.tool_calls.length > 0) {
        // Execute tools
        for (const call of message.tool_calls) {
          const fnName = call.function.name
          const args = JSON.parse(call.function.arguments || '{}')
          
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
        continue // Loop back to LLM
      } else {
        finalContent = message.content
        break
      }
    }

    return { result: finalContent }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: 'Errore Server', data: err.message })
  } finally {
    // Cleanup MCP processes
    for (const c of mcpClients) {
      try {
        await c.client.close()
      } catch (e) {}
    }
  }
})
