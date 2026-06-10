# Stage 1: Use nginx to serve static files
FROM nginx:alpine AS runner

# Copy static files (including .git/HEAD and .git/refs/ for hash injection)
COPY . /usr/share/nginx/html

# Inject commit hash into index.html meta tag (same logic as vercel-build.sh)
# .git/HEAD and .git/refs/ are small files (a few KB) kept by .dockerignore
RUN GIT_DIR=/usr/share/nginx/html/.git && \
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
        sed -i "s/__COMMIT_HASH__/$SHORT_SHA/g" /usr/share/nginx/html/index.html; \
      fi; \
    fi

# Remove unnecessary files
RUN rm -f /usr/share/nginx/html/AGENTS.md

# Clean up .git directory (no longer needed after hash injection)
RUN rm -rf /usr/share/nginx/html/.git

# Expose port
EXPOSE 8000

# Override nginx config to listen on port 8000
RUN sed -i 's/listen\s*80;/listen 8000;/g' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
