FROM nginx:alpine

# Create non-root user
RUN adduser -D -u 1001 nginxuser

# Copy static files
COPY . /usr/share/nginx/html/

# Set ownership
RUN chown -R nginxuser:nginxuser /usr/share/nginx/html

# Expose port
EXPOSE 8000

# Override default port
RUN sed -i 's/listen 80;/listen 8000;/' /etc/nginx/conf.d/default.conf

# Switch to non-root user
USER nginxuser

CMD ["nginx", "-g", "daemon off;"]
