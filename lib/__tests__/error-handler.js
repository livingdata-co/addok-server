import test from 'ava'
import express from 'express'
import request from 'supertest'
import errorHandler from '../error-handler.js'

function createServer(handler) {
  const app = express()
  app.get('/', handler)
  app.use(errorHandler)
  return app
}

function createError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

test('errorHandler / no error', async t => {
  const server = createServer((req, res) => {
    res.send({ok: true})
  })

  const {body} = await request(server)
    .get('/')
    .expect(200)

  t.deepEqual(body, {ok: true})
})

test('errorHandler / error with status code 400', async t => {
  const server = createServer((req, res, next) => {
    next(createError(400, 'foo'))
  })

  const {body} = await request(server)
    .get('/')
    .expect(400)

  t.deepEqual(body, {code: 400, message: 'foo'})
})

test('errorHandler / error with status code 500', async t => {
  const server = createServer((req, res, next) => {
    next(createError(500, 'foo'))
  })

  const {body} = await request(server)
    .get('/')
    .expect(500)

  t.deepEqual(body, {code: 500, message: 'An unexpected error has occurred'})
})

test('errorHandler / error without status code', async t => {
  const server = createServer((req, res, next) => {
    next(createError(null, 'foo'))
  })

  const {body} = await request(server)
    .get('/')
    .expect(500)

  t.deepEqual(body, {code: 500, message: 'An unexpected error has occurred'})
})
