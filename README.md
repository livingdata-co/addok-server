# addok-server

A full-featured HTTP API for addok

## Prerequisites

- Node.js 18 LTS and above
- yarn
- redis 7 and above
- wget or curl
- unzip
- python 3.10
- valid addok install (conform with addok.conf)

## Copy and edit env file

```bash
cp .env.sample .env
```

| Environment variable name | Description |
| --- | --- |
| `ADDOK_CONFIG_MODULE` * | Path to addok configuration file |
| `SQLITE_DB_PATH` * | Path to addok database |
| `ADDOK_FILTERS` | A list of fields to be indexed as available filters |
| `ADDOK_CLUSTER_NUM_NODES` | Number of nodes to instantiate (default to number of CPUs) |
| `ADDOK_REDIS_URL` * | Connection string to addok Redis instance (can be an array) |
| `PYTHON_PATH` | Path to `python` executable to use |

***Required**

Replace `ADDOK_CONFIG_MODULE` & `SQLITE_DB_PATH` with the right path.
If you want to use the currently downloaded data :

- `ADDOK_CONFIG_MODULE=data/addok.conf`
- `SQLITE_DB_PATH=data/addok.db`

## Install dependencies and start node server

```bash
yarn && yarn start
```

## Start redis server (open a new terminal)

```bash
redis-server
```

## Example with French BAN

*Assuming you already follow this step [Copy and edit env file](#copy-and-edit-env-file)*

### Download & extract required files

- Download

```bash
wget https://adresse.data.gouv.fr/data/ban/adresses/latest/addok/addok-france-bundle.zip -O data.zip
```

- Extract

```bash
unzip data.zip -d ./data
```

- Remove zip archive

```bash
rm data.zip
```

### Install dependencies and start node server

```bash
yarn && yarn start
```

### Start redis server (open a new terminal)

Go to `data` path and run `redis-server`

```bash
cd data && redis-server
```
