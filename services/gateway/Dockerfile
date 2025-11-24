FROM nginx:alpine

COPY certs /etc/nginx/certs 

# Создаем директории для логов
RUN mkdir -p /var/log/nginx

EXPOSE 443
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]

