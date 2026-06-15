# Stage 1: Build - Inject commit hash
FROM alpine:3.19 AS builder

WORKDIR /app

# Copy all static files
COPY . .

# Inject commit hash into index.html meta tag
# .git/HEAD and .git/refs/ are small files kept by .dockerignore
RUN GIT_DIR=/app/.git && \
    HEAD_FILE=$GIT_DIR/HEAD && \
    if [ -f "$HEAD_FILE" ]; then \
      HEAD=$(cat "$HEAD_FILE") && \
      case "$HEAD" in \
        "ref: "*) \
          REF=$(echo "$HEAD" | sed 's/ref: //' | tr -d '\n\r ') && \
          REF_FILE="$GIT_DIR/$REF" && \
          if [ -f "$REF_FILE" ]; then \
            SHORT_SHA=$(cat "$REF_FILE" | tr -d '\n\r ' | cut -c1-8); \
          else \
            SHORT_SHA=""; \
          fi ;; \
        *) \
          SHORT_SHA=$(echo "$HEAD" | tr -d '\n\r ' | cut -c1-8);; \
      esac && \
      if [ -n "$SHORT_SHA" ] && [ "$SHORT_SHA" != "__COMM" ]; then \
        sed -i "s/__COMMIT_HASH__/$SHORT_SHA/g" /app/index.html; \
      fi; \
    fi

# Remove unnecessary files
RUN rm -f /app/AGENTS.md /app/CLAUDE.md /app/CLAUDE.md.zip && \
    rm -rf /app/docs /app/screenshots /app/ppt /app/assets/icons /app/.git

# Stage 2: Serve with nginx
FROM nginx:alpine AS runner

# Copy static files from builder
COPY --from=builder /app /usr/share/nginx/html

# Override nginx config to listen on port 8000
RUN sed -i 's/listen\s*80;/listen 8000;/g' /etc/nginx/conf.d/default.conf && \
    sed -i 's|/usr/share/nginx/html;|/usr/share/nginx/html;\n    location / {\n        try_files $uri $uri/ /index.html;\n    }|g' /etc/nginx/conf.d/default.conf

# Add security headers
RUN echo 'add_header X-Frame-Options "SAMEORIGIN";' >> /etc/nginx/conf.d/default.conf && \
    echo 'add_header X-Content-Type-Options "nosniff";' >> /etc/nginx/conf.d/default.conf && \
    echo 'add_header X-XSS-Protection "1; mode=block";' >> /etc/nginx/conf.d/default.conf

EXPOSE 8000

CMD ["nginx", "-g", "daemon off;"]
