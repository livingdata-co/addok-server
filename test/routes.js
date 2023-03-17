import test from 'ava'
import request from 'supertest'
import express from 'express'
import createError from 'http-errors'
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

test('routes / reverse / results', async t => {
  const cluster = {
    reverse() {
      return [{id: 'foo'}]
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const response = await request(app).get('/reverse').expect(200)
  t.deepEqual(response.body, {
    type: 'FeatureCollection',
    attribution: 'BAN',
    features: [
      {id: 'foo'}
    ],
    licence: 'ETALAB-2.0',
    limit: 1,
    version: 'draft'
  })
})

test('routes / reverse / no results', async t => {
  const cluster = {
    reverse() {
      return []
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const response = await request(app).get('/reverse').expect(200)
  t.deepEqual(response.body, {
    type: 'FeatureCollection',
    attribution: 'BAN',
    features: [],
    licence: 'ETALAB-2.0',
    limit: 1,
    version: 'draft'
  })
})

test('routes / search / invalid parameter', async t => {
  const cluster = {
    geocode() {
      throw createError(400, 'Invalid search parameter')
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const {body} = await request(app).get('/search').expect(400)
  t.is(body.message, 'Invalid search parameter')
})

test('routes / reverse / invalid parameter', async t => {
  const cluster = {
    reverse() {
      throw createError(400, 'Invalid reverse parameter')
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const {body} = await request(app).get('/reverse').expect(400)
  t.is(body.message, 'Invalid reverse parameter')
})
