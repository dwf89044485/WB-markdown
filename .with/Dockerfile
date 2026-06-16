# Multi-stage build for static site
FROM nginx:alpine AS runner

# Remove default nginx static assets and config
RUN rm -rf /usr/share/nginx/html/* && \
    rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx config (port 8000, gzip, security headers, cache)
COPY .with/nginx.conf /etc/nginx/conf.d/default.conf

# Copy all static assets
COPY . /usr/share/nginx/html/

# Clean up unnecessary files
RUN rm -rf /usr/share/nginx/html/.git \
    /usr/share/nginx/html/.gitignore \
    /usr/share/nginx/html/.DS_Store \
    /usr/share/nginx/html/.agent \
    /usr/share/nginx/html/.agents \
    /usr/share/nginx/html/.claude \
    /usr/share/nginx/html/.codebuddy \
    /usr/share/nginx/html/.gstack \
    /usr/share/nginx/html/.superpowers \
    /usr/share/nginx/html/.vercel \
    /usr/share/nginx/html/.with/nginx.conf \
    /usr/share/nginx/html/AGENTS.md \
    /usr/share/nginx/html/CLAUDE.md \
    /usr/share/nginx/html/MARKDOWN_STYLE_TOKENS.md \
    /usr/share/nginx/html/design-notes.js \
    /usr/share/nginx/html/vercel-build.sh \
    /usr/share/nginx/html/vercel.json \
    /usr/share/nginx/html/*.md

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set proper permissions
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /etc/nginx/conf.d

EXPOSE 8000

USER appuser

CMD ["nginx", "-g", "daemon off;"]
