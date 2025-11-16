import test from 'ava'
import request from 'supertest'
import express from 'express'
import createError from 'http-errors'
import createRouter from '../lib/router.js'

const testConfig = {filters: {}}

test('createRouter / search / results', async t => {
  const cluster = {
    geocode() {
      return [{id: 'foo'}, {id: 'bar'}]
    }
  }

  const app = express()
  app.use('/', createRouter({cluster, filters: testConfig.filters}))

  const response = await request(app).get('/search').expect(200)
  t.deepEqual(response.body, {
    type: 'FeatureCollection',
    features: [
      {id: 'foo'},
      {id: 'bar'}
    ],
    limit: 5
  })
})

test('createRouter / search / no results', async t => {
  const cluster = {
    geocode() {
      return []
    }
  }

  const app = express()
  app.use('/', createRouter({cluster, filters: testConfig.filters}))

  const response = await request(app).get('/search').expect(200)
  t.deepEqual(response.body, {
    type: 'FeatureCollection',
    features: [],
    limit: 5
  })
})

test('createRouter / reverse / results', async t => {
  const cluster = {
    reverse() {
      return [{id: 'foo'}]
    }
  }

  const app = express()
  app.use('/', createRouter({cluster, filters: testConfig.filters}))

  const response = await request(app).get('/reverse').expect(200)
  t.deepEqual(response.body, {
    type: 'FeatureCollection',
    features: [
      {id: 'foo'}
    ],
    limit: 1
  })
})

test('createRouter / reverse / no results', async t => {
  const cluster = {
    reverse() {
      return []
    }
  }

  const app = express()
  app.use('/', createRouter({cluster, filters: testConfig.filters}))

  const response = await request(app).get('/reverse').expect(200)
  t.deepEqual(response.body, {
    type: 'FeatureCollection',
    features: [],
    limit: 1
  })
})

test('createRouter / search / with attribution and license', async t => {
  const cluster = {
    geocode() {
      return [{id: 'foo'}, {id: 'bar'}]
    }
  }

  const app = express()
  app.use('/', createRouter({
    cluster,
    filters: testConfig.filters,
    attribution: 'BAN',
    license: 'ETALAB-2.0'
  }))

  const response = await request(app).get('/search').expect(200)
  t.deepEqual(response.body, {
    type: 'FeatureCollection',
    attribution: 'BAN',
    license: 'ETALAB-2.0',
    features: [
      {id: 'foo'},
      {id: 'bar'}
    ],
    limit: 5
  })
})

test('createRouter / search / invalid parameter', async t => {
  const cluster = {
    geocode() {
      throw createError(400, 'Invalid search parameter')
    }
  }

  const app = express()
  app.use('/', createRouter({cluster, filters: testConfig.filters}))

  const {body} = await request(app).get('/search').expect(400)
  t.is(body.message, 'Invalid search parameter')
})

test('createRouter / reverse / invalid parameter', async t => {
  const cluster = {
    reverse() {
      throw createError(400, 'Invalid reverse parameter')
    }
  }

  const app = express()
  app.use('/', createRouter({cluster, filters: testConfig.filters}))

  const {body} = await request(app).get('/reverse').expect(400)
  t.is(body.message, 'Invalid reverse parameter')
})
