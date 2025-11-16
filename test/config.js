import {mkdirSync, writeFileSync, rmSync} from 'node:fs'
import path from 'node:path'
import {tmpdir} from 'node:os'
import test from 'ava'
import {readJSON, validateConfig} from '../lib/config.js'

let testDir

test.before(() => {
  testDir = path.join(tmpdir(), 'addok-config-test-' + Date.now())
  mkdirSync(testDir, {recursive: true})
})

test.after.always(() => {
  rmSync(testDir, {recursive: true, force: true})
})

// Tests for readJSON
test('readJSON / reads valid JSON file', async t => {
  const filePath = path.join(testDir, 'valid.json')
  const data = {hello: 'world', number: 42}
  writeFileSync(filePath, JSON.stringify(data))

  const result = await readJSON(filePath)
  t.deepEqual(result, data)
})

test('readJSON / throws on invalid JSON', async t => {
  const filePath = path.join(testDir, 'invalid.json')
  writeFileSync(filePath, '{invalid json}')

  await t.throwsAsync(async () => readJSON(filePath), {
    instanceOf: SyntaxError
  })
})

test('readJSON / throws on missing file', async t => {
  await t.throwsAsync(
    async () => readJSON('/non/existent/file.json'),
    {code: 'ENOENT'}
  )
})

// Tests for validateConfig
test('validateConfig / validates minimal config', t => {
  const config = {filters: {}}
  const result = validateConfig(config)
  t.deepEqual(result, {filters: {}})
})

test('validateConfig / validates config with filters', t => {
  const config = {
    filters: {
      type: {maxValues: 1},
      citycode: {maxValues: 100},
      postcode: {maxValues: 20}
    }
  }

  const result = validateConfig(config)
  t.deepEqual(result, config)
})

test('validateConfig / applies default maxValues of 1', t => {
  const config = {
    filters: {
      type: {}
    }
  }

  const result = validateConfig(config)
  t.deepEqual(result, {
    filters: {
      type: {maxValues: 1}
    }
  })
})

test('validateConfig / applies default filters object', t => {
  const config = {}
  const result = validateConfig(config)
  t.deepEqual(result, {filters: {}})
})

test('validateConfig / throws on invalid maxValues type', t => {
  const config = {
    filters: {
      type: {maxValues: 'invalid'}
    }
  }

  const error = t.throws(() => validateConfig(config), {instanceOf: Error})
  t.regex(error.message, /Configuration validation failed/)
  t.regex(error.message, /must be a number/)
})

test('validateConfig / throws on negative maxValues', t => {
  const config = {
    filters: {
      type: {maxValues: -1}
    }
  }

  const error = t.throws(() => validateConfig(config), {instanceOf: Error})
  t.regex(error.message, /Configuration validation failed/)
  t.regex(error.message, /must be greater than or equal to 1/)
})

test('validateConfig / throws on zero maxValues', t => {
  const config = {
    filters: {
      type: {maxValues: 0}
    }
  }

  const error = t.throws(() => validateConfig(config), {instanceOf: Error})
  t.regex(error.message, /Configuration validation failed/)
  t.regex(error.message, /must be greater than or equal to 1/)
})

test('validateConfig / throws on non-integer maxValues', t => {
  const config = {
    filters: {
      type: {maxValues: 1.5}
    }
  }

  const error = t.throws(() => validateConfig(config), {instanceOf: Error})
  t.regex(error.message, /Configuration validation failed/)
  t.regex(error.message, /must be an integer/)
})

test('validateConfig / strips unknown properties', t => {
  const config = {
    filters: {
      type: {maxValues: 1}
    },
    unknownKey: 'should be removed'
  }

  const result = validateConfig(config)
  t.deepEqual(result, {
    filters: {
      type: {maxValues: 1}
    }
  })
  t.false('unknownKey' in result)
})

test('validateConfig / accepts multiple filters', t => {
  const config = {
    filters: {
      type: {maxValues: 1},
      citycode: {maxValues: 100},
      postcode: {maxValues: 20},
      depcode: {maxValues: 20}
    }
  }

  const result = validateConfig(config)
  t.deepEqual(result, config)
})

test('validateConfig / handles empty filter definition', t => {
  const config = {
    filters: {
      type: {},
      citycode: {maxValues: 10}
    }
  }

  const result = validateConfig(config)
  t.deepEqual(result, {
    filters: {
      type: {maxValues: 1},
      citycode: {maxValues: 10}
    }
  })
})
