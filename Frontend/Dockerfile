# Stage 1: Build the React application
FROM node:18 as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Add this line to see the contents of the build output
RUN echo "Contents of /app/dist in builder stage:" && ls -lA /app/dist

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Add this line to see the contents of the Nginx webroot
RUN echo "Contents of /usr/share/nginx/html in Nginx stage:" && ls -lA /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add this line to verify nginx.conf is copied
RUN echo "Contents of /etc/nginx/conf.d/:" && ls -lA /etc/nginx/conf.d/ && echo "Contents of default.conf:" && cat /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]