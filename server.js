#!/usr/bin/env node
import 'dotenv/config.js'

import process from 'node:process'

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import createError from 'http-errors'

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

app.get('/reverse', w(async (req, res) => {
  const params = {
    lon: req.query.lon ? Number.parseFloat(req.query.lon) : undefined,
    lat: req.query.lat ? Number.parseFloat(req.query.lat) : undefined,
    limit: req.query.limit ? Number.parseInt(req.query.limit, 10) : 5,
    filters: {}
  }

  for (const filter of ADDOK_FILTERS) {
    params.filters[filter] = req.query[filter]
  }

  const results = await cluster.reverse(params)

  res.send({
    type: 'FeatureCollection',
    version: 'draft',
    features: results,
    attribution: 'BAN',
    licence: 'ETALAB-2.0',
    filters: Object.keys(params.filters).length > 0 ? params.filters : undefined,
    center: params.lon && params.lat ? [params.lon, params.lat] : undefined,
    limit: params.limit
  })
}))

app.post('/batch', express.json(), w(async (req, res) => {
  const {requests} = req.body

  if (!Array.isArray(requests)) {
    throw createError(400, 'requests is a required param (array)')
  }

  if (requests.length > 100) {
    throw createError(400, 'requests must not contains more than 100 items')
  }

  for (const r of requests) {
    if (!['geocode', 'reverse'].includes(r.operation)) {
      throw createError(400, 'operation must be one of geocode or reverse')
    }

    if (!r.params) {
      throw createError(400, 'params is required for each requests item')
    }
  }

  const baseParams = {limit: 2, autocomplete: false}
  const globalParams = req.body.params ? {...req.body.params, ...baseParams} : baseParams

  const results = await Promise.all(requests.map(async r => {
    try {
      const {operation, params} = r
      const rParams = {...params, ...globalParams}
      const operationResult = await cluster[operation](rParams)

      if (operationResult.length === 0) {
        return {
          status: 'not-found'
        }
      }

      const result = {
        ...operationResult[0].properties,
        next_score: operationResult[1] ? operationResult[1].properties.score : undefined,
        lon: operationResult[0].geometry.coordinates[0],
        lat: operationResult[0].geometry.coordinates[1]
      }

      return {
        status: 'ok',
        result
      }
    } catch (error) {
      console.error(error)
      return {
        status: 'error',
        error: error.message
      }
    }
  }))

  res.send({results})
}))

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Start listening on port ${PORT}`)
})
