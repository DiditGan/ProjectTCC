# Stage 1: Build the React application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock, pnpm-lock.yaml)
COPY package*.json ./

# Install dependencies
# If you are using pnpm, you might want to change this to 'RUN pnpm install'
# Ensure your base image 'node:20-alpine' has pnpm or install it first.
# For npm:
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output from the builder stage to Nginx's web root directory
# Vite typically builds to a 'dist' folder. If your output folder is different (e.g., 'build'), adjust here.
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 for Nginx
EXPOSE 80

# Start Nginx and keep it in the foreground
CMD ["nginx", "-g", "daemon off;"]