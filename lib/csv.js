import {pipeline} from 'node:stream/promises'

import contentDisposition from 'content-disposition'
import intoStream from 'into-stream'
import stringify from 'csv-write-stream'
import iconv from 'iconv-lite'
import createError from 'http-errors'

import {createGeocodeStream} from 'addok-geocode-stream'
import {previewCsvFromStream, validateCsvFromStream, createCsvReadStream} from '@livingdata/tabular-data-helpers'

function ensureArray(value) {
  if (value) {
    return Array.isArray(value) ? value : [value]
  }

  return []
}

export function csv({cluster, reverse}) {
  return async (req, res) => {
    if (!req.file) {
      throw createError(400, 'A CSV file must be provided in data field')
    }

    const {parseErrors, columns: columnsInFile, formatOptions} = await previewCsvFromStream(intoStream(req.file.buffer))

    if (parseErrors) {
      throw createError(400, 'Errors in CSV file: ' + parseErrors.join(', '))
    }

    await new Promise((resolve, reject) => {
      const fileStream = intoStream(req.file.buffer)

      validateCsvFromStream(fileStream, {formatOptions})
        .on('error', error => reject(createError(400, 'Errors in CSV file: ' + error.message)))
        .on('complete', () => resolve())
    })

    const {originalName} = req.file

    const geocodeOptions = {
      cluster,
      strategy: 'cluster',
      reverse
    }

    if (req.body.columns) {
      geocodeOptions.columns = ensureArray(req.body.columns)

      if (geocodeOptions.columns.some(c => !columnsInFile.includes(c))) {
        throw createError(400, 'At least one given column name is unknown')
      }
    }

    if (req.body.citycode) {
      geocodeOptions.citycode = req.body.citycode
    }

    if (req.body.postcode) {
      geocodeOptions.postcode = req.body.postcode
    }

    if (req.body.type) {
      geocodeOptions.type = req.body.type
    }

    if (req.body.lon) {
      geocodeOptions.lon = req.body.type
    }

    if (req.body.lat) {
      geocodeOptions.lat = req.body.lat
    }

    if (req.body.result_columns) {
      geocodeOptions.resultColumns = ensureArray(req.body.result_columns)
    }

    const resultFileName = originalName ? 'geocoded-' + originalName : 'geocoded.csv'

    res
      .type('csv')
      .set('Content-Disposition', contentDisposition(resultFileName))

    try {
      await pipeline(
        intoStream(req.file.buffer),
        createCsvReadStream({formatOptions}),
        createGeocodeStream(geocodeOptions),
        stringify({separator: formatOptions.delimiter, newline: formatOptions.linebreak}),
        iconv.encodeStream(formatOptions.encoding),
        res)
    } catch (error) {
      res.destroy()
      console.log(error)
    }
  }
}
