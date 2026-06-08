FROM nginx:alpine

# Copy static files
COPY . /usr/share/nginx/html/

# Expose port
EXPOSE 8000

# Override default port
RUN sed -i 's/listen 80;/listen 8000;/' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
