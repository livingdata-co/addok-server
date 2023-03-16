import test from 'ava'
import express from 'express'
import request from 'supertest'
import w from '../lib/w.js'

test('w with a simple 200 response', async t => {
  const app = express()

  app.get('/', w(async (req, res) => res.sendStatus(200)))

  const response = await request(app).get('/')
  t.is(response.status, 200)
})

test('w with an error thown', async t => {
  const app = express()

  app.get('/', w(async () => {
    throw new Error('Error')
  }))

  const response = await request(app).get('/')
  t.is(response.status, 500)
})

