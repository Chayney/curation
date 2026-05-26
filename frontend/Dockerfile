# ---------- build stage ----------
FROM node:20-alpine AS build

WORKDIR /app

# 依存関係
COPY package*.json ./
RUN npm install

# ソース
COPY . .

# vite build
RUN npm run build


# ---------- production stage ----------
FROM nginx:alpine

# buildされたファイルを配置
COPY --from=build /app/dist /usr/share/nginx/html

# nginx設定を上書き
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]