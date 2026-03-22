FROM node:24-slim

WORKDIR /app

# Install curl for healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY sites/*/package.json ./sites/
COPY libs/*/package.json ./libs/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the project
COPY . .

# Healthcheck for all sites
HEALTHCHECK --interval=10s --timeout=5s --start-period=90s --retries=15 \
  CMD curl -f http://localhost:35421 && \
      curl -f http://localhost:35422 && \
      curl -f http://localhost:35423 && \
      curl -f http://localhost:35424 && \
      curl -f http://localhost:35425

# Default command (can be overridden in docker-compose)
CMD ["pnpm", "dev"]
