import test from 'ava'

import {ensureSingleValue} from '../lib/search.js'

test('ensure single value / with array', t => {
  const value = ['first', 'second', 'last']
  t.is(ensureSingleValue(value), 'last')
})

test('ensure single value / with string', t => {
  t.is(ensureSingleValue('value'), 'value')
})

test('ensure single value / with undefined', t => {
  t.is(ensureSingleValue(undefined), undefined)
})

