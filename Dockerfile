# syntax=docker/dockerfile:1

# Build stage: install dependencies and compile the Angular app
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install dependencies using package-lock for reproducible installs
COPY package*.json ./
RUN npm ci

# Copy the rest of the workspace and build the production bundle
COPY angular.json ./
COPY tsconfig*.json ./
COPY public ./public
COPY src ./src
RUN npm run build

# Runtime stage: serve the compiled app with Nginx
FROM nginx:1.27-alpine

# Copy a minimal nginx config that supports Angular's client-side routing
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output from the builder stage
COPY --from=builder /app/dist/visitan-tec/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]