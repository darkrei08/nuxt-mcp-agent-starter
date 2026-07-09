FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install
COPY . .
RUN bun run build

FROM oven/bun:1-alpine
LABEL org.opencontainers.image.source=https://github.com/darkrei08/nuxt-mcp-agent-starter
LABEL org.opencontainers.image.description="Nuxt MCP Agent Starter"
WORKDIR /app
COPY --from=builder /app/.output ./.output
EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000
CMD ["bun", "run", ".output/server/index.mjs"]
