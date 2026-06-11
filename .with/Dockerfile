FROM nginx:alpine AS base

# Production stage
FROM nginx:alpine

# Copy static files
COPY . /usr/share/nginx/html

# Remove dev-only files
RUN rm -f /usr/share/nginx/html/AGENTS.md \
  /usr/share/nginx/html/README.md \
  /usr/share/nginx/html/.gitignore \
  /usr/share/nginx/html/.with/Dockerfile \
  && rm -rf /usr/share/nginx/html/.git \
  /usr/share/nginx/html/.with

# Nginx config for SPA
RUN echo 'server { \
  listen 8000; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8000

CMD ["nginx", "-g", "daemon off;"]
