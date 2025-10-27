import test from 'ava'
import request from 'supertest'
import express from 'express'
import createRouter from '../lib/routes.js'

test('routes / batch / results', async t => {
  const cluster = {
    geocode({q}) {
      if (q === 'foo1') {
        return [
          {geometry: {coordinates: [2.1, 49.12]}, properties: {id: 'foo1.0', score: 0.5}},
          {geometry: {coordinates: [2.1, 48.22]}, properties: {id: 'foo1.1', score: 0.2}}
        ]
      }

      if (q === 'foo2') {
        return [
          {geometry: {coordinates: [2.2, 49.12]}, properties: {id: 'foo2.0', score: 0.6}}
        ]
      }
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const {body, status} = await request(app).post('/batch').send({
    requests: [
      {id: 'request1', operation: 'geocode', params: {q: 'foo1'}},
      {id: 'request2', operation: 'geocode', params: {q: 'foo2'}}
    ]
  })

  t.is(status, 200)
  t.deepEqual(body.results[0], {
    id: 'request1',
    status: 'ok',
    result: {
      id: 'foo1.0',
      score: 0.5,
      lat: 49.12,
      lon: 2.1,
      next_score: 0.2
    }
  })
  t.deepEqual(body.results[1], {
    id: 'request2',
    status: 'ok',
    result: {
      id: 'foo2.0',
      score: 0.6,
      lat: 49.12,
      lon: 2.2
    }
  })
})

test('routes / batch / no result', async t => {
  const cluster = {
    reverse() {
      return []
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const {body, status} = await request(app).post('/batch').send({
    requests: [
      {id: 'request', operation: 'reverse', params: {lon: 2.1, lat: 49.12}}
    ]
  })

  t.is(status, 200)
  t.deepEqual(body.results[0], {
    id: 'request',
    status: 'not-found'
  })
})

test('routes / batch / wrong operation', async t => {
  const cluster = {
    wrong() {
      return []
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const {body, status} = await request(app).post('/batch').send({
    requests: [
      {id: 'request', operation: 'geocode', params: {q: 'foo1'}}
    ]
  })

  t.is(status, 200)
  t.deepEqual(body.results[0], {
    id: 'request',
    status: 'error',
    error: 'cluster[operation] is not a function'
  })
})

test('routes / batch / no array', async t => {
  const cluster = {
    geocode() {
      return []
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const {body, status} = await request(app).post('/batch').send({
    requests: {id: 'request', operation: 'geocode', params: {q: 'foo1'}}
  })

  t.is(status, 400)
  t.is(body.code, 400)
  t.is(body.message, 'requests is a required param (array)')
})

test('routes / batch / wrong operation in parameter', async t => {
  const cluster = {
    geocode() {
      return []
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const {body, status} = await request(app).post('/batch').send({
    requests: [
      {id: 'request', operation: 'wrong', params: {q: 'foo1'}}
    ]
  })

  t.is(status, 400)
  t.is(body.code, 400)
  t.is(body.message, 'operation must be one of geocode or reverse')
})

test('routes / batch / missing params', async t => {
  const cluster = {
    geocode() {
      return []
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const {body, status} = await request(app).post('/batch').send({
    requests: [
      {id: 'request', operation: 'geocode'}
    ]
  })

  t.is(status, 400)
  t.is(body.code, 400)
  t.is(body.message, 'params is required for each requests item')
})

test('routes / batch / request contains more than 100 items', async t => {
  const cluster = {
    geocode() {
      return []
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const requests = Array.from({length: 101})

  const {body, status} = await request(app).post('/batch').send({
    requests
  })

  t.is(status, 400)
  t.is(body.code, 400)
  t.is(body.message, 'requests must not contains more than 100 items')
})

test('routes / batch / with multiple filter values as string', async t => {
  let capturedParams

  const cluster = {
    geocode(params) {
      capturedParams = params
      return [
        {geometry: {coordinates: [2.1, 49.12]}, properties: {id: 'foo.0', score: 0.5}}
      ]
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const {status} = await request(app).post('/batch').send({
    requests: [
      {
        id: 'request1',
        operation: 'geocode',
        params: {
          q: 'foo',
          filters: {citycode: '59000+59100'}
        }
      }
    ]
  })

  t.is(status, 200)
  t.truthy(capturedParams.filters)
  t.deepEqual(capturedParams.filters.citycode, ['59000', '59100'])
})

test('routes / batch / with multiple filter values as array', async t => {
  let capturedParams

  const cluster = {
    geocode(params) {
      capturedParams = params
      return [
        {geometry: {coordinates: [2.1, 49.12]}, properties: {id: 'foo.0', score: 0.5}}
      ]
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const {status} = await request(app).post('/batch').send({
    requests: [
      {
        id: 'request1',
        operation: 'geocode',
        params: {
          q: 'foo',
          filters: {citycode: ['59000', '59100']}
        }
      }
    ]
  })

  t.is(status, 200)
  t.truthy(capturedParams.filters)
  t.deepEqual(capturedParams.filters.citycode, ['59000', '59100'])
})

test('routes / batch / with global filters', async t => {
  let capturedParams

  const cluster = {
    geocode(params) {
      capturedParams = params
      return [
        {geometry: {coordinates: [2.1, 49.12]}, properties: {id: 'foo.0', score: 0.5}}
      ]
    }
  }

  const app = express()
  app.use('/', createRouter(cluster))

  const {status} = await request(app).post('/batch').send({
    params: {
      filters: {type: 'municipality+locality'}
    },
    requests: [
      {
        id: 'request1',
        operation: 'geocode',
        params: {q: 'foo'}
      }
    ]
  })

  t.is(status, 200)
  t.truthy(capturedParams.filters)
  t.deepEqual(capturedParams.filters.type, ['municipality', 'locality'])
})

