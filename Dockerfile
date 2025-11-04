# Stage 1
FROM nikolaik/python-nodejs:python3.13-nodejs24-slim AS build
WORKDIR /app

RUN apt-get update && apt-get install -y build-essential gcc

COPY package.json package-lock.json ./
RUN npm ci --omit dev

COPY requirements.txt ./
RUN pip install --user -r requirements.txt

# Stage 2
FROM redis:8 AS redis

# Stage 3
FROM nikolaik/python-nodejs:python3.13-nodejs24-slim
WORKDIR /app

RUN apt-get update && \
    apt-get install -y wget zstd tar curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=redis /usr/local/bin/redis-server /usr/local/bin/redis-server
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /root/.local /root/.local

COPY . .

# Copy and make init scripts executable
COPY init-data.sh /app/init-data.sh
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/init-data.sh /app/docker-entrypoint.sh

ENV ADDOK_CONFIG_MODULE=/app/data/addok.conf
ENV SQLITE_DB_PATH=/app/data/addok.db
ENV ADDOK_REDIS_DATA_DIR=/app/data

ENV PATH=/root/.local/bin:$PATH

ENV NODE_ENV=production

EXPOSE 5000

CMD ["/app/docker-entrypoint.sh"]
