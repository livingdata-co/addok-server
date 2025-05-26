# addok-server

[![node-current](https://img.shields.io/badge/node-%3E%3D%2018.12-brightgreen)](https://img.shields.io/badge/node-%3E%3D%2018.12-brightgreen) [![Coverage Status](https://coveralls.io/repos/github/livingdata-co/addok-server/badge.svg)](https://coveralls.io/github/livingdata-co/addok-server)

A full-featured HTTP API for addok

## Prerequisites

- Node.js 18 LTS and above
- redis 7
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
| `SQLITE_DB_PATH` | Path to addok SQLite database |
| `ADDOK_FILTERS` | A list of fields to be indexed as available filters |
| `ADDOK_CLUSTER_NUM_NODES` | Number of nodes to instantiate (default to number of CPUs) |
| `ADDOK_REDIS_URL` | Connection string to addok Redis instance (can be an array) |
| `ADDOK_REDIS_DATA_DIR` | Path to Redis data dir (in case you want `addok-server` handle its own `redis-server` instance) |
| `ADDOK_REDIS_STARTUP_TIMEOUT` | Limit time allowed to Redis to start when using managed Redis |
| `PYTHON_PATH` | Path to `python` executable to use |

***Required**

If you want to use the currently downloaded data :

- `ADDOK_CONFIG_MODULE=data/addok.conf`
- `SQLITE_DB_PATH=data/addok.db`
- `ADDOK_REDIS_DATA_DIR=data/`

## Install dependencies and start node server

```bash
npm install && npm run start
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
npm install && npm run start
```

### Start redis server (open a new terminal)

Go to `data` path and run `redis-server`

```bash
cd data && redis-server
```

## Use

### Endpoints

*in the examples we assume that the server was started on the default port : 5000*

### **GET** `/search`

| Param | Description | Default |
| --- | --- | --- |
| `q` | Text input to geocode (required) | |
| `autocomplete` | Auto-complete mode (`boolean`) | `false` |
| `lon`, `lat` | Coordinates of reference position | |
| `limit` | Number of returned results | `5` |
| `filters` | Additional filters (depend on addok config) | `{}` |

*example :*
`curl "http://localhost:5000/search/?q=lil&autocomplete=1&limit=15"`

### **GET** `/reverse`

| Param | Description | Default |
| --- | --- | --- |
| `lon`, `lat` | Coordinates of reference position (required) | |
| `filters` | Additional filters (depend on addok config) | `{}` |

*example :*
`curl "http://localhost:5000/reverse/?lon=2.2&lat=48.12?type=locality"`

In this example, `type` is a filter. It was added to addok configuration.

### **POST** `/batch`

This endpoint allows you to process multiple requests in a single POST request.
You must send an array of requests that will be processed in parallel.

| Param | Description |
| --- | --- |
| `requests` | An array of requests to process. Each request must be an object containing the keys `id`, `operation` and `params` (required) |

**Request object**

| Key | Description | Value example |
| --- | --- | --- |
|`id` | Identify each operation | "foo" (string) |
|`operation` | Define wich operation to execute | "geocode" or "reverse" (string)  |
| `params` | Object with same params used for "geocode" or "reverse" | `{"q": "lille"}` (geocode) - `{"lon": 2.2, "lat": 48.12}` (reverse)

*batch body request example*
```json
{
  "requests": [
    {"id": "foo", "operation": "geocode", "params": {"q": "lille"}},
    {"id": "bar", "operation": "reverse", "params": {"lon": 2.2, "lat": 48.12}}
  ]
}
```

## **POST** `/search/csv`

The CSV file must be passed via data parameter like this : `data=@path/to/file.csv`

*example :*
`curl -X POST -F data=@path/to/file.csv http://localhost:5000/search/csv/`

You can define the columns to be used via multiple columns parameters

*example :*
`curl -X POST -F data=@path/to/file.csv -F columns=street -F columns=city http://localhost:5000/search/csv/`

## **POST** `/reverse/csv`

The CSV file, encoded in UTF-8 must be passed via the data parameter. It must contain lon and lat
columns

*example :*
`curl -X POST -F data=@path/to/file.csv http://localhost:5000/reverse/csv/`
