/* eslint-disable unicorn/numeric-separators-style */

import test from 'ava'
import request from 'supertest'
import express from 'express'

import routes from '../routes.js'
import {mockCluster} from '../__mocks__/cluster.js'

const cluster = mockCluster()

function getApp() {
  const app = express()
  app.use(routes(cluster))
  return app
}

test.serial('search', async t => {
  const {status, body} = await request(getApp())
    .get('/search?q=lille')

  t.is(status, 200)
  t.is(body.query, 'lille')
  t.is(Object.keys(body).length, 7)
  t.is(Object.keys(body.features).length, 2)
})

test.serial('reverse', async t => {
  const {status, body} = await request(getApp())
    .get('/reverse?lon=0.644113&lat=44.150456')

  t.is(status, 200)
  t.is(body.query, undefined)
  t.deepEqual(body.center, [0.644113, 44.150456])
  t.is(Object.keys(body).length, 7)
  t.is(Object.keys(body.features).length, 1)
})

test.serial('search / no result', async t => {
  const {status, body} = await request(getApp())
    .get('/search?q=bordeaux')

  t.is(status, 200)
  t.is(body.query, 'bordeaux')
  t.is(Object.keys(body).length, 7)
  t.is(Object.keys(body.features).length, 0)
})

test.serial('search / with citycode filter', async t => {
  const {status, body} = await request(getApp())
    .get('/search?q=lille&citycode=59350')

  t.is(status, 200)
  t.is(body.query, 'lille')
  t.is(body.filters.citycode, '59350')
  t.is(Object.keys(body).length, 8)
  t.is(Object.keys(body.features).length, 1)
})

test.serial('search / with type filter', async t => {
  const {status, body} = await request(getApp())
    .get('/search?q=lille&type=municipality')

  t.is(status, 200)
  t.is(body.query, 'lille')
  t.is(body.filters.type, 'municipality')
  t.is(Object.keys(body).length, 8)
  t.is(Object.keys(body.features).length, 1)
})

test.serial('search / with postcode filter and no result', async t => {
  const {status, body} = await request(getApp())
    .get('/search?q=lille&postcode=57222')

  t.is(status, 200)
  t.is(body.query, 'lille')
  t.is(body.filters.postcode, '57222')
  t.is(Object.keys(body).length, 8)
  t.is(Object.keys(body.features).length, 0)
})

