/* eslint-disable unicorn/numeric-separators-style */

import test from 'ava'

import {ensureSingleValue, formatParams, createFeatureCollection} from '../lib/search.js'

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

test('createFeatureCollection / operation geocode', t => {
  const features = [{id: 'foo'}, {id: 'bar'}]
  const params = {q: 'Lille', limit: 2, filters: {}}
  const result = createFeatureCollection({params, operation: 'geocode', results: features})

  t.deepEqual(result, {
    type: 'FeatureCollection',
    version: 'draft',
    features,
    attribution: 'BAN',
    licence: 'ETALAB-2.0',
    query: 'Lille',
    filters: undefined,
    center: undefined,
    limit: 2
  })
  t.is(Object.keys(result).length, 9)
})

test('createFeatureCollection / operation reverse', t => {
  const features = [{id: 'foo'}, {id: 'bar'}]
  const params = {q: 'Bordeaux', filters: {}}
  const result = createFeatureCollection({params, operation: 'reverse', results: features})

  t.deepEqual(result, {
    type: 'FeatureCollection',
    version: 'draft',
    features,
    attribution: 'BAN',
    licence: 'ETALAB-2.0',
    query: 'Bordeaux',
    filters: undefined,
    center: undefined,
    limit: 1
  })
  t.is(Object.keys(result).length, 9)
})
