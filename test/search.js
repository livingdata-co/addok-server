/* eslint-disable unicorn/numeric-separators-style */

import test from 'ava'
import {
  ensureSingleValue,
  parseFilterValues,
  formatParams,
  createFeatureCollection
} from '../lib/search.js'

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

test('parseFilterValues / with undefined', t => {
  t.deepEqual(parseFilterValues('testfilter', undefined), [])
})

test('parseFilterValues / with single string', t => {
  t.deepEqual(parseFilterValues('testfilter', 'value'), ['value'])
})

test('parseFilterValues / with plus separator', t => {
  t.deepEqual(parseFilterValues('testfilter', 'value1+value2+value3'), ['value1', 'value2', 'value3'])
})

test('parseFilterValues / with space separator', t => {
  t.deepEqual(parseFilterValues('testfilter', 'value1 value2 value3'), ['value1', 'value2', 'value3'])
})

test('parseFilterValues / with array of strings', t => {
  t.deepEqual(parseFilterValues('testfilter', ['value1', 'value2']), ['value1', 'value2'])
})

test('parseFilterValues / with array of strings with plus', t => {
  t.deepEqual(parseFilterValues('testfilter', ['value1+value2', 'value3']), ['value1', 'value2', 'value3'])
})

test('parseFilterValues / with duplicates', t => {
  t.deepEqual(parseFilterValues('testfilter', 'value1+value2+value1'), ['value1', 'value2'])
})

test('parseFilterValues / with whitespace', t => {
  t.deepEqual(parseFilterValues('testfilter', '  value1  +  value2  '), ['value1', 'value2'])
})

test('parseFilterValues / with empty values', t => {
  t.deepEqual(parseFilterValues('testfilter', 'value1++value2'), ['value1', 'value2'])
})

test('parseFilterValues / throws when exceeding maxValues', t => {
  const error = t.throws(() => parseFilterValues('citycode', 'v1+v2+v3', 2), {instanceOf: Error})
  t.regex(error.message, /Too many values for filter "citycode"/)
})

test('parseFilterValues / allows exact maxValues', t => {
  t.deepEqual(parseFilterValues('testfilter', 'v1+v2', 2), ['v1', 'v2'])
})

test('parseFilterValues / no limit when maxValues undefined', t => {
  t.deepEqual(parseFilterValues('testfilter', 'v1+v2+v3+v4+v5'), ['v1', 'v2', 'v3', 'v4', 'v5'])
})

test('formatParams / operation geocode', t => {
  const filters = {citycode: {maxValues: 100}}
  const params = formatParams({query: {q: 'Lille', citycode: '57222', limit: 15}, operation: 'geocode', filters})

  t.deepEqual(params, {
    autocomplete: true,
    filters: {
      citycode: ['57222']
    },
    lat: undefined,
    limit: 15,
    lon: undefined,
    q: 'Lille'
  })
})

test('formatParams / operation geocode with multiple filter values', t => {
  const filters = {citycode: {maxValues: 100}}
  const params = formatParams({query: {q: 'Lille', citycode: '57222+59000'}, operation: 'geocode', filters})

  t.deepEqual(params, {
    autocomplete: true,
    filters: {
      citycode: ['57222', '59000']
    },
    lat: undefined,
    limit: 5,
    lon: undefined,
    q: 'Lille'
  })
})

test('formatParams / operation geocode with repeated filter parameter', t => {
  const filters = {citycode: {maxValues: 100}}
  const params = formatParams({query: {q: 'Lille', citycode: ['57222', '59000']}, operation: 'geocode', filters})

  t.deepEqual(params, {
    autocomplete: true,
    filters: {
      citycode: ['57222', '59000']
    },
    lat: undefined,
    limit: 5,
    lon: undefined,
    q: 'Lille'
  })
})

test('formatParams / operation reverse', t => {
  const filters = {}
  const params = formatParams({query: {lon: '3.045433', lat: '50.630992'}, operation: 'reverse', filters})

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
    features,
    query: 'Lille',
    filters: undefined,
    center: undefined,
    limit: 2
  })
  t.is(Object.keys(result).length, 6)
})

test('createFeatureCollection / operation reverse', t => {
  const features = [{id: 'foo'}, {id: 'bar'}]
  const params = {q: 'Bordeaux', filters: {}}
  const result = createFeatureCollection({params, operation: 'reverse', results: features})

  t.deepEqual(result, {
    type: 'FeatureCollection',
    features,
    query: 'Bordeaux',
    filters: undefined,
    center: undefined,
    limit: 1
  })
  t.is(Object.keys(result).length, 6)
})

test('createFeatureCollection / with attribution and license', t => {
  const features = [{id: 'foo'}, {id: 'bar'}]
  const params = {q: 'Lille', limit: 2, filters: {}}
  const result = createFeatureCollection({
    params,
    operation: 'geocode',
    results: features,
    attribution: 'BAN',
    license: 'ETALAB-2.0'
  })

  t.deepEqual(result, {
    type: 'FeatureCollection',
    features,
    attribution: 'BAN',
    license: 'ETALAB-2.0',
    query: 'Lille',
    filters: undefined,
    center: undefined,
    limit: 2
  })
  t.is(Object.keys(result).length, 8)
})

test('formatParams / throws when exceeding maxValues', t => {
  const filters = {citycode: {maxValues: 1}}
  const error = t.throws(() => formatParams({
    query: {q: 'Lille', citycode: '57222+59000'},
    operation: 'geocode',
    filters
  }), {instanceOf: Error})
  t.regex(error.message, /Too many values for filter/)
})
