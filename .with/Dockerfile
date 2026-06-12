# Multi-stage build for static WorkBuddy site
# Stage 1: Prepare static files with commit hash injection
FROM alpine:3.19 AS prepare

WORKDIR /app

# Copy all static files
COPY . .

# Inject commit hash into index.html meta tag
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
RUN rm -f /app/AGENTS.md /app/CLAUDE.md /app/CLAUDE.md.zip /app/MARKDOWN_STYLE_TOKENS.md && \
    rm -rf /app/docs /app/screenshots /app/ppt /app/.git /app/.agent /app/.agents /app/.claude /app/.playwright-cli /app/Users && \
    rm -rf /app/assets/icons /app/icons /app/scripts

# Stage 2: Serve with nginx
FROM nginx:alpine AS runner

# Copy prepared static files from build stage
COPY --from=prepare /app /usr/share/nginx/html

# Remove unnecessary files from nginx image
RUN rm -f /usr/share/nginx/html/AGENTS.md

# Expose port 8000
EXPOSE 8000

# Override nginx config to listen on port 8000
RUN sed -i 's/listen\s*80;/listen 8000;/g' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
