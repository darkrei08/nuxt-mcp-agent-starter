<p align="center">
  <img src="https://img.shields.io/badge/Nuxt_3-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white" alt="Nuxt 3" />
  <img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Bun" />
  <img src="https://img.shields.io/badge/Model_Context_Protocol-SDK-blueviolet.svg?logo=mcp" alt="MCP SDK" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

# Nuxt MCP Agent Starter 🚀

[🇮🇹 Leggi in Italiano](README.it.md) | [🇬🇧 English](README.md)

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

### ✨ Advanced Features (Implemented)
Based on MCP specification research, this boilerplate fully supports:
- **Progress Notifications (SSE)**: Instead of a static "Thinking..." state, the agent loop uses Server-Sent Events to stream real-time progress updates (e.g., "Executing tool...", "Querying Database...") directly to the Nuxt UI.
- **Roots / Safe Filesystem Access**: Automatically exposes the local workspace directory to MCP servers securely, allowing them to read and modify specific project files without escaping the container.
- **Server Sampling (LLM Inception)**: Allows downstream MCP servers (like terminal agents) to explicitly request generation tasks from the parent OpenAI model using the provided API key.
