# Gunakan Node.js untuk build React app
FROM node:18 as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Gunakan Nginx untuk menyajikan aplikasi
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Copy konfigurasi Nginx jika diperlukan
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
