/* eslint-disable unicorn/numeric-separators-style */

import test from 'ava'

import {ensureSingleValue, formatParams, createFeatureCollection} from '../search.js'
import {mockCluster, featureA, featureB} from '../__mocks__/cluster.js'

test('Ensure single value / with array', t => {
  const value = ['first', 'second', 'last']
  const singleValue = ensureSingleValue(value)
  t.is(singleValue, 'last')
})

test('Ensure single value / with string', t => {
  const singleValue = ensureSingleValue('value')
  t.is(singleValue, 'value')
})

test('Ensure single value / with undefined', t => {
  const singleValue = ensureSingleValue(undefined)
  t.is(singleValue, undefined)
})

test('Format parameters / operation geocode', t => {
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

test('Format parameters / operation reverse', t => {
  const params = formatParams({queries: {lon: '3.045433', lat: '50.630992'}, operation: 'reverse'})

  t.deepEqual(params, {
    filters: {},
    lat: 50.630992,
    limit: 5,
    lon: 3.045433
  })
})

test('Create feature collection / geocode', t => {
  const params = formatParams({queries: {q: 'Lille'}, operation: 'geocode'})
  const cluster = mockCluster()
  const results = cluster.geocode(params)
  const result = createFeatureCollection({params, operation: 'geocode', results})

  t.deepEqual(result, {
    type: 'FeatureCollection',
    version: 'draft',
    features: [featureA, featureB],
    attribution: 'BAN',
    licence: 'ETALAB-2.0',
    query: 'Lille',
    filters: undefined,
    center: undefined,
    limit: 5
  })
  t.is(Object.keys(result).length, 9)
})

test('Create feature collection / reverse', t => {
  const params = formatParams({queries: {lon: '0.644113', lat: '44.150456'}, operation: 'reverse'})
  const cluster = mockCluster()
  const results = cluster.reverse(params)
  const result = createFeatureCollection({params, operation: 'reverse', results})

  t.deepEqual(result, {
    type: 'FeatureCollection',
    version: 'draft',
    features: [featureB],
    attribution: 'BAN',
    licence: 'ETALAB-2.0',
    query: undefined,
    filters: undefined,
    center: [0.644113, 44.150456],
    limit: 1
  })
  t.is(Object.keys(result).length, 9)
})
