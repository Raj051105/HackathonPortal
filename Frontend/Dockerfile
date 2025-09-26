FROM node:20-alpine AS build
WORKDIR /app
COPY Frontend/package*.json ./
COPY Frontend/yarn.lock ./
RUN npm ci
COPY Frontend/ .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY Frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
