# MyWorld - Minecraft 方块世界
# 多阶段构建: Node 构建 → Nginx 托管静态文件

# ── 阶段 1: 构建 ──
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# ── 阶段 2: 生产镜像 ──
FROM nginx:alpine AS production

# 复制构建产物到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置（支持 SPA 路由）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 非 root 运行
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
