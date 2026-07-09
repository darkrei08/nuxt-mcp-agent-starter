# Nuxt MCP Agent Starter 🚀

[🇬🇧 English](#english) | [🇮🇹 Italiano](#italiano)

<a name="english"></a>
## 🇬🇧 English

### 🎯 Purpose
The **Nuxt MCP Agent Starter** is a cutting-edge boilerplate that integrates the **Model Context Protocol (MCP)** directly into a Nuxt 3 backend. It transforms standard text-based LLM chats into true Agentic Loops. It can dynamically load MCP servers (e.g., GitHub, PostgreSQL, Slack, Google Drive) and execute complex tool-calling interactions up to a predefined limit before returning the final context to the user.

### 🛠 Tech Stack
- **Framework**: Nuxt 3 (Nitro Engine)
- **Integrations**: `@modelcontextprotocol/sdk` (Official SDK)
- **Styling**: Tailwind CSS
- **Runtime**: Bun
- **Deployment**: Docker, GitHub Container Registry (GHCR), CI/CD via GitHub Actions

### 🔌 How to Integrate
This starter works perfectly as an independent microservice in a Dockerized environment. 
Example `docker-compose.yml` snippet:
```yaml
services:
  mcp-agent:
    image: ghcr.io/darkrei08/nuxt-mcp-agent-starter:latest
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - NUXT_PUBLIC_MCP_URL=http://localhost:3001
```

### 🔮 Advanced Features (Roadmap)
Based on MCP specification research, the following advanced features are tracked for future integration:
- **Progress Notifications (SSE)**: Instead of a static "Thinking..." state, the agent loop will emit Server-Sent Events to stream progress updates (e.g., "Downloading file...", "Querying Database...") directly to the frontend.
- **Roots / Safe Filesystem Access**: Providing explicit directory boundaries to allow the MCP Agent to read and modify specific project files securely without escaping the container.
- **Server Sampling**: Allowing downstream MCP servers to explicitly request generation tasks from the parent LLM.

---

<a name="italiano"></a>
## 🇮🇹 Italiano

### 🎯 Scopo del Progetto
Il **Nuxt MCP Agent Starter** è un boilerplate all'avanguardia che integra nativamente il **Model Context Protocol (MCP)** in un backend Nuxt 3. Trasforma una semplice chat LLM testuale in un vero e proprio Agent Loop (Ciclo Agente). È in grado di caricare dinamicamente server MCP (es. GitHub, PostgreSQL, Slack, Google Drive) ed eseguire iterazioni di "Tool Calling" autonome prima di restituire il risultato finale all'utente.

### 🛠 Tecnologie Utilizzate
- **Framework**: Nuxt 3 (Nitro Engine)
- **Integrazioni**: `@modelcontextprotocol/sdk` (SDK Ufficiale)
- **Styling**: Tailwind CSS
- **Runtime**: Bun
- **Deployment**: Docker, GitHub Container Registry (GHCR), CI/CD tramite GitHub Actions

### 🔌 Come Integrarlo
Questo starter nasce per funzionare come microservizio indipendente in un ambiente Docker.
Esempio di utilizzo nel `docker-compose.yml`:
```yaml
services:
  mcp-agent:
    image: ghcr.io/darkrei08/nuxt-mcp-agent-starter:latest
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - NUXT_PUBLIC_MCP_URL=http://localhost:3001
```

### 🔮 Funzionalità Avanzate (Roadmap)
Dall'analisi delle specifiche ufficiali del protocollo MCP, abbiamo mappato le seguenti feature avanzate per i prossimi sviluppi:
- **Notifiche di Progresso (SSE)**: Invece di un generico stato di "Caricamento...", il ciclo Agente invierà Server-Sent Events per mostrare i vari step ("Lettura database...", "Scrittura file...") in tempo reale sulla UI.
- **Roots (Accesso Sicuro ai File)**: Definizione di confini di directory espliciti, per permettere al server MCP di accedere e modificare i file del progetto in totale sicurezza, evitando fughe dal container (Directory Traversal).
- **Sampling (Campionamento)**: Permettere ai server MCP esterni di richiedere a loro volta piccoli task di generazione all'LLM principale durante l'esecuzione del tool.
