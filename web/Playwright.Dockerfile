FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

# Install pnpm directly (skip corepack entirely)
RUN npm install -g pnpm

# Copy only lock + manifest first (better caching)
COPY package.json pnpm-lock.yaml ./

ENV DEBUG=pw:api

# Install deps
RUN pnpm install --frozen-lockfile

# Copy rest of the project
COPY . .

CMD ["pnpm", "exec", "playwright", "test"]