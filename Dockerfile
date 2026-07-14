FROM node:22-alpine AS builder
# Copy bun binary from bun image for fast dependency installation
COPY --from=oven/bun:1-alpine /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --ignore-scripts
COPY . .
RUN npx nuxt build

FROM node:22-alpine AS runner
LABEL org.opencontainers.image.source=https://github.com/darkrei08/nuxt-mcp-agent-starter
LABEL org.opencontainers.image.description="Nuxt MCP Agent Starter"
WORKDIR /app
COPY --from=builder /app/.output ./.output
EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production
CMD ["node", ".output/server/index.mjs"]
