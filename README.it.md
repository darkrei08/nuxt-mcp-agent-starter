<p align="center">
  <img src="https://img.shields.io/badge/Nuxt_3-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white" alt="Nuxt 3" />
  <img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Bun" />
  <img src="https://img.shields.io/badge/Model_Context_Protocol-SDK-blueviolet.svg?logo=mcp" alt="MCP SDK" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

# Nuxt MCP Agent Starter 🚀

[🇮🇹 Leggi in Italiano](README.it.md) | [🇬🇧 English](README.md)

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

### ✨ Funzionalità Avanzate (Implementate)
Dall'analisi delle specifiche ufficiali del protocollo MCP, abbiamo implementato:
- **Notifiche di Progresso (SSE)**: Invece di un generico stato di "Caricamento...", il ciclo Agente sfrutta i Server-Sent Events (SSE) per mostrare i vari step ("Esecuzione tool...", "Scrittura file...") in tempo reale sulla UI.
- **Roots (Accesso Sicuro ai File)**: Definizione di confini di directory espliciti sul filesystem, per permettere al server MCP di accedere e modificare i file del progetto in totale sicurezza, evitando fughe dal container.
- **Sampling (Campionamento LLM)**: Permette ai server MCP esterni (come terminali autonomi) di richiedere a loro volta task di generazione all'LLM principale (OpenAI) incanalandoli tramite la tua stessa API Key.
