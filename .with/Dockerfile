# Multi-stage build for static site
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy all static assets
COPY . /usr/share/nginx/html/

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set proper permissions
RUN chown -R appuser:appgroup /usr/share/nginx/html

# Update nginx config to listen on port 8000
RUN sed -i 's/listen       80;/listen       8000;/g' /etc/nginx/conf.d/default.conf && \
    sed -i 's/listen  \[::\]:80;/listen  [::]:8000;/g' /etc/nginx/conf.d/default.conf

EXPOSE 8000

USER appuser

CMD ["nginx", "-g", "daemon off;"]
