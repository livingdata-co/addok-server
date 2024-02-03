# Stage 1
FROM nikolaik/python-nodejs:python3.10-nodejs20-slim AS build
WORKDIR /app

RUN apt-get update && apt-get install -y build-essential gcc

COPY package.json yarn.lock ./
RUN yarn install --prod --frozen-lockfile

RUN pip install addok==1.1.2 addok-fr==1.0.1 addok-france==1.1.3 addok-sqlite-store==1.0.1

# Stage 2
FROM --platform=linux/amd64 redis:7.0 AS redis

# Stage 3
FROM nikolaik/python-nodejs:python3.10-nodejs20-slim
WORKDIR /app

RUN apt-get update && \
    apt-get install -y unzip wget && \
    rm -rf /var/lib/apt/lists/*

COPY --from=redis /usr/local/bin/redis-server /usr/local/bin/redis-server
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /root/.local /root/.local

COPY . .

ENV ADDOK_CONFIG_MODULE /etc/addok/addok.conf
ENV SQLITE_DB_PATH /data/addok.db
ENV ADDOK_REDIS_DATA_DIR /data

ENV PATH=/root/.local/bin:$PATH

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "server.js"]
