FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["node", "index.js"]