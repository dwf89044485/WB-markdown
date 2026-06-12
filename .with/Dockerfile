# Static HTML site — multi-stage build with Nginx
FROM nginx:1.25-alpine AS runner

# Copy all static files
COPY . /usr/share/nginx/html

# Remove dev-only files
RUN rm -f /usr/share/nginx/html/.gitignore \
    /usr/share/nginx/html/AGENTS.md \
    /usr/share/nginx/html/README.md \
    /usr/share/nginx/html/COMMIT_HASH \
    /usr/share/nginx/html/commit-hash.js \
    /usr/share/nginx/html/scripts/deploy-pages.sh \
    /usr/share/nginx/html/scripts/deploy-pages.py \
    /usr/share/nginx/html/vercel-build.sh \
    /usr/share/nginx/html/docs/commit-hash.md \
    /usr/share/nginx/html/.with/Dockerfile

# Remove .git directory if present
RUN rm -rf /usr/share/nginx/html/.git

# Custom nginx config for SPA-like fallback (not needed here, but good practice)
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
