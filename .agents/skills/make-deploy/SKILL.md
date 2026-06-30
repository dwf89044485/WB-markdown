---
name: make-deploy
description: 自动化部署 Skill.根据项目类型生成符合最佳实践的 Dockerfile（多阶段构建、最小镜像、安全优化），并自动放置到指定目录，最终调用智研交付流接口触发自动化部署流程。当用户说"部署我的项目"、"帮我部署"、"启动部署流程"时使用。
---

# Make Deploy

生成完备的Docker File，并调用智研交付流实现项目的自动化部署

## 何时使用

- "启动部署流程"
- "部署我的项目、应用、程序"
- "帮我部署"


## Main Process
1. 通过对项目文件的探查，生成完备的可直接使用的Dockerfile
2. 确保将Dockerfile 放置在{workspace path}/.with/Dockerfile 目录下
3. 调用智研交付流部署接口，启动自动化部署流程
4. 完毕结束

# Dockerfile 生成规范

### 1. 判断项目类型

必要时你可以通过扫描一些标志性的文件来确定项目的语言和框架：

```bash
# Node.js
[ -f "package.json" ] && echo "Node.js/JavaScript"

# Python
[ -f "requirements.txt" ] || [ -f "Pipfile" ] || [ -f "pyproject.toml" ] && echo "Python"

# Go
[ -f "go.mod" ] && echo "Go"

# Java
[ -f "pom.xml" ] || [ -f "build.gradle" ] && echo "Java"

# Ruby
[ -f "Gemfile" ] && echo "Ruby"

# PHP
[ -f "composer.json" ] && echo "PHP"

# Rust
[ -f "Cargo.toml" ] && echo "Rust"

# .NET
[ -f "*.csproj" ] && echo ".NET"
```
你需要自己探查用户的代码仓库，搜集所有必要的信息
你需要阅读package files来判断项目使用的框架 (例如Express, Next.js, Django, Flask, etc.).

### 2. 生成对应语言的 Dockerfile

以下是一些常见语言的示例：

## Node.js / JavaScript

**Basic Node.js:**
```dockerfile
# Multi-stage build for production
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Development dependencies (for build)
FROM base AS build-deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build stage
FROM build-deps AS build
WORKDIR /app
COPY . .
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built app
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs package.json ./

USER nodejs

EXPOSE 8000

ENV NODE_ENV=production
ENV PORT=8000

CMD ["node", "dist/index.js"]
```

**Next.js:**
```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8000

ENV PORT 8000

CMD ["node", "server.js"]
```

## Python

**Flask:**
```dockerfile
FROM python:3.11-slim AS base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Dependencies
FROM base AS deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production
FROM base AS runner

# Create non-root user
RUN useradd -m -u 1001 appuser

# Copy dependencies from deps stage
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy application
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "app:app"]
```

**Django:**
```dockerfile
FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Dependencies
FROM base AS deps
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production
FROM base AS runner

# Create non-root user
RUN useradd -m -u 1001 django

# Copy dependencies
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/bin/pg_* /usr/bin/

# Copy application
COPY --chown=django:django . .

# Collect static files
RUN python manage.py collectstatic --noinput

USER django

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "myproject.wsgi:application"]
```

## Go

**Go application:**
```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o main .

# Production stage (minimal image)
FROM scratch

# Copy CA certificates for HTTPS
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy binary from builder
COPY --from=builder /app/main /main

# Expose port
EXPOSE 8000

# Run binary
CMD ["/main"]
```

**With CGO (needs libc):**
```dockerfile
FROM golang:1.21-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o main .

# Production
FROM alpine:latest

RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /app/main .

EXPOSE 8000

CMD ["./main"]
```

## Java

**Spring Boot (Gradle):**
```dockerfile
# Build stage
FROM gradle:8-jdk17 AS build

WORKDIR /app

# Copy gradle files
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# Download dependencies (cached layer)
RUN gradle dependencies --no-daemon

# Copy source and build
COPY src ./src
RUN gradle build --no-daemon -x test

# Production stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy jar from build stage
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8000

ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Spring Boot (Maven):**
```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom and download dependencies (cached)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source and build
COPY src ./src
RUN mvn package -DskipTests

# Production
FROM eclipse-temurin:17-jre-alpine

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8000

ENTRYPOINT ["java", "-jar", "app.jar"]
```

## Ruby

**Rails:**
```dockerfile
FROM ruby:3.2-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    nodejs \
    yarn \
    tzdata

WORKDIR /app

# Dependencies
FROM base AS deps

COPY Gemfile Gemfile.lock ./
RUN bundle install --jobs 4 --retry 3

# Production
FROM base AS runner

# Copy dependencies
COPY --from=deps /usr/local/bundle /usr/local/bundle

# Copy application
COPY . .

# Precompile assets
RUN bundle exec rake assets:precompile

# Create non-root user
RUN adduser -D rails
USER rails

EXPOSE 8000

CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
```

## Rust

**Rust application:**
```dockerfile
# Build stage
FROM rust:1.75-alpine AS builder

RUN apk add --no-cache musl-dev

WORKDIR /app

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Cache dependencies
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy source and build
COPY src ./src
RUN touch src/main.rs && cargo build --release

# Production (minimal)
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/target/release/app /usr/local/bin/app

EXPOSE 8000

CMD ["app"]
```

## PHP

**Laravel:**
```dockerfile
FROM php:8.2-fpm-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    postgresql-dev \
    zip \
    unzip

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql

# Install composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dependencies
FROM base AS deps
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader

# Production
FROM base AS runner

# Copy dependencies
COPY --from=deps /var/www/html/vendor ./vendor

# Copy application
COPY . .

# Generate autoloader
RUN composer dump-autoload --optimize

# Set permissions
RUN chown -R www-data:www-data /var/www/html

USER www-data

EXPOSE 8000

CMD ["php-fpm"]
```

### 3. 设置环境变量

检查程序启动需要哪些必备的环境变量，并加入到dockerfile中，千万不要遗漏！

### 4. 添加 .dockerignore

创建 .dockerignore 有助于减少构建内容的简洁:

```dockerignore
# Version control
.git
.gitignore

# Dependencies (will be installed in container)
node_modules
vendor
venv
__pycache__

# Build artifacts
dist
build
*.pyc
*.pyo

# IDE
.vscode
.idea
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Test files
test
tests
**/*.test.js
**/*.spec.js

# Documentation
README.md
docs

# CI/CD
.github
.gitlab-ci.yml

# Environment
.env
.env.local
*.env

# Misc
coverage
.cache
tmp
temp
```

### 5. 技术优化建议

**Layer caching:**
- Copy dependency files first
- Install dependencies (cached)
- Copy source code (changes frequently)

**Multi-stage builds:**
- Build stage: All tools needed
- Production stage: Only runtime + artifacts

**Minimize layers:**
- Combine RUN commands with &&
- Clean up in same layer

**Use alpine images:**
- Much smaller (5-50MB vs 500MB+)
- Faster pulls and deploys

**Example optimization:**

```dockerfile
# ❌ BAD: Many layers, large image
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]

# ✅ GOOD: Optimized
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["node", "index.js"]
```

### 6. 安全方面的最佳实践

**Don't run as root:**
```dockerfile
RUN adduser -D appuser
USER appuser
```

**Use specific versions:**
```dockerfile
# ❌ BAD: Latest can break
FROM node:latest

# ✅ GOOD: Pinned version
FROM node:20.10.0-alpine3.19
```

**Scan for vulnerabilities:**
```bash
docker scan myimage:latest
```

**Multi-stage to exclude dev dependencies:**
```dockerfile
# Build with dev dependencies
FROM node:20 AS build
RUN npm ci  # Includes devDependencies

# Production without dev dependencies
FROM node:20-alpine
COPY --from=build /app/node_modules ./node_modules
```


### 最佳实践Checklist


- [ ] 使用多阶段构建（构建阶段与运行阶段分离）
- [ ] 使用 alpine 或 slim 基础镜像
- [ ] 在复制源代码前先复制包文件（利用缓存）
- [ ] 包含 .dockerignore 文件
- [ ] 最小化层数（合并 RUN 命令）
- [ ] 生成 Dockerfile 时禁止使用 heredoc 语法
- [ ] 使用 COPY 而非 ADD
- [ ] 设置环境变量
- [ ] EXPOSE 的端口必须固定是 8000
- [ ] 生成的Dockerfile 已放置在{workspace}/.with/dockerfile 目录下 


# 交付流部署接口调用规范

1. 请首先调用 get_env_info 工具获取环境变量信息，调用部署接口需要with-chat-id、with-deployment-id、with-sub-chat-id、with-signature、with-timestamp 和 user_name.
2. 之后请参考下列用法调用WebDeployments接口，该接口将触发一个自动化部署流程，如果接口返回成功则说明流程已经成功启动

```bash
// 设置代理
curl -XPOST 'http://with.woa.com/apigw/trpc.gongfeng.background_agent_manager.BackgroundAgentManagerHttp/chat-agent/WebDeployments' -d '{
  "chat_id": "{with-chat-id}",
  "sub_chat_id": "{with-sub-chat-id}", 
  "deployment_id": "{with-deployment-id}"
}' -H 'content-type: application/json' -H 'X-Username: {user_name}' -H 'with-signature: {with-signature}' -H 'with-timestamp: {with-timestamp}' -H 'with-chat-id: {with-chat-id}' -H 'with-deployment-id: {with-deployment-id}' -H 'with-sub-chat-id: {with-sub-chat-id}'

```
