import {readFile} from 'node:fs/promises'
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
