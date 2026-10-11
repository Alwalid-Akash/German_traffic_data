FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_API_BASE_URL=http://localhost:3000
# Vite embeds this public configuration into the compiled JavaScript.
RUN VITE_API_BASE_URL="$VITE_API_BASE_URL" npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
