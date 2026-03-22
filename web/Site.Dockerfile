FROM node:24-slim

WORKDIR /app

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

# Default command (can be overridden in docker-compose)
CMD ["pnpm", "dev"]
