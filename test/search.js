/* eslint-disable unicorn/numeric-separators-style */

import test from 'ava'

import {ensureSingleValue, formatParams} from '../lib/search.js'

test('ensureSingleValue / with array', t => {
  const value = ['first', 'second', 'last']
  t.is(ensureSingleValue(value), 'last')
})

test('ensureSingleValue / with string', t => {
  t.is(ensureSingleValue('value'), 'value')
})

test('ensureSingleValue / with undefined', t => {
  t.is(ensureSingleValue(undefined), undefined)
})

test('formatParams / operation geocode', t => {
  const params = formatParams({queries: {q: 'Lille', citycode: '57222', limit: 15}, operation: 'geocode'})

  t.deepEqual(params, {
    autocomplete: true,
    filters: {
      citycode: '57222'
    },
    lat: undefined,
    limit: 15,
    lon: undefined,
    q: 'Lille'
  })
})

test('formatParams / operation reverse', t => {
  const params = formatParams({queries: {lon: '3.045433', lat: '50.630992'}, operation: 'reverse'})

  t.deepEqual(params, {
    filters: {},
    lat: 50.630992,
    limit: 5,
    lon: 3.045433
  })
})
