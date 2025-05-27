FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
# Build for production
# RUN npm run build
# Use a lightweight server to serve the static files
CMD ["npm", "run", "dev"]