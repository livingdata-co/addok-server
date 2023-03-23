FROM nikolaik/python-nodejs:python3.10-nodejs18-bullseye

RUN mkdir /app
WORKDIR /app

# Addok / Python part

RUN pip install cython addok==1.1.0 addok-fr==1.0.1 addok-france==1.1.3 addok-sqlite-store==1.0.1

ENV ADDOK_CONFIG_MODULE /etc/addok/addok.conf
ENV SQLITE_DB_PATH /data/addok.db

# Node.js part

COPY package.json yarn.lock ./
RUN yarn --production --frozen-lockfile

COPY . .

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "server.js"]
