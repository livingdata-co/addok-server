import {readFile} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import Joi from 'joi'

/**
 * Read and parse a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<Object>} Parsed JSON content
 */
export async function readJSON(filePath) {
  const content = await readFile(filePath, 'utf8')
  return JSON.parse(content)
}

/**
 * Joi schema for server configuration
 */
const configSchema = Joi.object({
  attribution: Joi.string().optional(),
  license: Joi.string().optional(),
  filters: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      maxValues: Joi.number().integer().min(1).default(1)
    }).default({maxValues: 1})
  ).default({})
}).required()

/**
 * Validate server configuration
 * @param {Object} config - Configuration object to validate
 * @returns {Object} Validated and normalized configuration
 * @throws {Error} If configuration is invalid
 */
export function validateConfig(config) {
  const {error, value} = configSchema.validate(config, {
    abortEarly: false,
    stripUnknown: true
  })

  if (error) {
    throw new Error(`Configuration validation failed: ${error.message}`)
  }

  return value
}

/**
 * Load server configuration from environment or default path
 * Attempts to load configuration from ADDOK_SERVER_CONFIG_PATH env var,
 * or falls back to ./addok-server.config.json
 * If no file is found, returns empty config which will be validated
 * @returns {Promise<Object>} Validated configuration
 */
export async function loadServerConfig() {
  const configPath = path.resolve(
    process.env.ADDOK_SERVER_CONFIG_PATH || './addok-server.config.json'
  )

  let config = {}

  try {
    config = await readJSON(configPath)
  } catch (error) {
    // If file not found, use empty config (will get defaults from validation)
    if (error.code !== 'ENOENT') {
      // For other errors (parse errors, etc.), rethrow
      throw error
    }
  }

  return validateConfig(config)
}
