# Stage 1
FROM nikolaik/python-nodejs:python3.13-nodejs22-slim AS build
WORKDIR /app

RUN apt-get update && apt-get install -y build-essential gcc

COPY package.json package-lock.json ./
RUN npm ci --omit dev

COPY requirements.txt ./
RUN pip install --user -r requirements.txt

# Stage 2
FROM redis:7.4 AS redis

# Stage 3
FROM nikolaik/python-nodejs:python3.13-nodejs22-slim
WORKDIR /app

RUN apt-get update && \
    apt-get install -y unzip wget && \
    rm -rf /var/lib/apt/lists/*

COPY --from=redis /usr/local/bin/redis-server /usr/local/bin/redis-server
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /root/.local /root/.local

COPY . .

ENV ADDOK_CONFIG_MODULE=/data/addok.conf
ENV SQLITE_DB_PATH=/data/addok.db
ENV ADDOK_REDIS_DATA_DIR=/data

ENV PATH=/root/.local/bin:$PATH

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "server.js"]
