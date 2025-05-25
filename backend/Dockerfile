FROM node:20-alpine
WORKDIR /app

# Enable corepack to use pnpm specified in package.json
RUN corepack enable

# Copy package.json and pnpm-lock.yaml (if available)
# Ensure pnpm-lock.yaml is committed to your repository for reproducible builds
COPY package.json pnpm-lock.yaml* ./

# Install dependencies using pnpm
# Use --frozen-lockfile if pnpm-lock.yaml is present and you want to ensure exact versions
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# The CMD is already correct for running the application directly with node
CMD ["node", "index.js"]