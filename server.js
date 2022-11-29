#!/usr/bin/env node
import 'dotenv/config.js'

import process from 'node:process'

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import {createCluster} from 'addok-cluster'

import w from './lib/w.js'
import errorHandler from './lib/error-handler.js'

const PORT = process.env.PORT || 5000
const ADDOK_FILTERS = process.env.ADDOK_FILTERS ? process.env.ADDOK_FILTERS.split(',') : []

const app = express()
const cluster = await createCluster()

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

app.use(cors({origin: true}))

app.get('/search', w(async (req, res) => {
  const params = {
    q: req.query.q,
    autocomplete: req.query.autocomplete !== '0',
    lon: req.query.lon ? Number.parseFloat(req.query.lon) : undefined,
    lat: req.query.lat ? Number.parseFloat(req.query.lat) : undefined,
    limit: req.query.limit ? Number.parseInt(req.query.limit, 10) : 5,
    filters: {}
  }

  for (const filter of ADDOK_FILTERS) {
    params.filters[filter] = req.query[filter]
  }

  const results = await cluster.geocode(params)

  res.send({
    type: 'FeatureCollection',
    version: 'draft',
    features: results,
    attribution: 'BAN',
    licence: 'ETALAB-2.0',
    query: params.q,
    filters: Object.keys(params.filters).length > 0 ? params.filters : undefined,
    center: params.lon && params.lat ? [params.lon, params.lat] : undefined,
    limit: params.limit
  })
}))

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Start listening on port ${PORT}`)
})
