import test from 'ava'
import request from 'supertest'
import express from 'express'
import createRouter from '../lib/routes.js'

test('routes / search / results', async t => {
  const cluster = {
    geocode() {
      return [{id: 'foo'}, {id: 'bar'}]
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const response = await request(app).get('/search').expect(200)
  t.deepEqual(response.body, {
    type: 'FeatureCollection',
    attribution: 'BAN',
    features: [
      {id: 'foo'},
      {id: 'bar'}
    ],
    licence: 'ETALAB-2.0',
    limit: 5,
    version: 'draft'
  })
})

test('routes / search / no results', async t => {
  const cluster = {
    geocode() {
      return []
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const response = await request(app).get('/search').expect(200)
  t.deepEqual(response.body, {
    type: 'FeatureCollection',
    attribution: 'BAN',
    features: [],
    licence: 'ETALAB-2.0',
    limit: 5,
    version: 'draft'
  })
})
