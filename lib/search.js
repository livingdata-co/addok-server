import process from 'node:process'

const ADDOK_FILTERS = process.env.ADDOK_FILTERS ? process.env.ADDOK_FILTERS.split(',') : []

export function ensureSingleValue(value) {
  if (Array.isArray(value)) {
    return value.at(-1)
  }

  return value
}

export function formatParams({queries, operation}) {
  const params = {
    lon: queries.lon ? Number.parseFloat(ensureSingleValue(queries.lon)) : undefined,
    lat: queries.lat ? Number.parseFloat(ensureSingleValue(queries.lat)) : undefined,
    limit: queries.limit ? Number.parseInt(ensureSingleValue(queries.limit), 10) : 5,
    filters: {}
  }

  if (operation === 'geocode') {
    params.q = ensureSingleValue(queries.q)
    params.autocomplete = ensureSingleValue(queries.autocomplete) !== '0'
  }

  for (const filter of ADDOK_FILTERS) {
    const value = ensureSingleValue(queries[filter])

    if (value) {
      params.filters[filter] = value
    }
  }

  return params
}

export function createFeatureCollection({params, operation, results}) {
  const fc = {
    type: 'FeatureCollection',
    version: 'draft',
    features: results,
    attribution: 'BAN',
    licence: 'ETALAB-2.0',
    query: params.q,
    filters: Object.keys(params.filters).length > 0 ? params.filters : undefined,
    center: params.lon && params.lat ? [params.lon, params.lat] : undefined,
    limit: operation === 'geocode' ? params.limit : 1
  }

  if (operation === 'geocode') {
    fc.query = params.q
  }

  return fc
}

export function search({cluster, reverse}) {
  const operation = reverse ? 'reverse' : 'geocode'

  return async (req, res) => {
    const params = formatParams({queries: {...req.query}, operation})

    const ac = new AbortController()
    req.on('close', () => ac.abort())

    const results = await cluster[operation](params, {signal: ac.signal, priority: 'high'})
    const result = createFeatureCollection({params, operation, results})

    res.send(result)
  }
}
