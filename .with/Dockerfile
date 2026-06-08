# Stage 1: Use nginx to serve static files
FROM nginx:alpine AS runner

# Copy static files
COPY . /usr/share/nginx/html

# Remove unnecessary files
RUN rm -f /usr/share/nginx/html/AGENTS.md

# Expose port
EXPOSE 8000

# Override nginx config to listen on port 8000
RUN sed -i 's/listen\s*80;/listen 8000;/g' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
