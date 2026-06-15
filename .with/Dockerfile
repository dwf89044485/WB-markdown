# Multi-stage build for static site
FROM nginx:alpine AS runner

# Remove default nginx static assets and config
RUN rm -rf /usr/share/nginx/html/* && \
    rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx config (port 8000, gzip, security headers, cache)
COPY .with/nginx.conf /etc/nginx/conf.d/default.conf

# Copy all static assets
COPY . /usr/share/nginx/html/

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
