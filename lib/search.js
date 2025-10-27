import process from 'node:process'
import onFinished from 'on-finished'

const ADDOK_FILTERS = process.env.ADDOK_FILTERS ? process.env.ADDOK_FILTERS.split(',') : []

export function ensureSingleValue(value) {
  if (Array.isArray(value)) {
    return value.at(-1)
  }

  return value
}

export function parseFilterValues(value) {
  if (!value) {
    return []
  }

  // Normalize to array
  const values = Array.isArray(value) ? value : [value]

  // Split each value by '+' separator and flatten
  const splitValues = values.flatMap(v => {
    if (typeof v === 'string') {
      // Split on '+' first (primary separator)
      if (v.includes('+')) {
        return v.split('+')
      }

      // Fallback to space if no '+' found (handles URL-encoded '+' -> space)
      if (v.includes(' ')) {
        return v.split(' ')
      }

      return [v]
    }

    return []
  })

  // Trim, filter empty values, and deduplicate
  const trimmed = splitValues.map(v => v.trim()).filter(v => v.length > 0)
  return [...new Set(trimmed)]
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
    const values = parseFilterValues(queries[filter])

    if (values.length > 0) {
      params.filters[filter] = values
    }
  }

  return params
}

export function createFeatureCollection({params, operation, results}) {
  const fc = {
    type: 'FeatureCollection',
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
    onFinished(res, () => ac.abort()) // Abort the batch request if the client disconnects

    const results = await cluster[operation](params, {signal: ac.signal, priority: 'high'})
    const result = createFeatureCollection({params, operation, results})

    res.send(result)
  }
}
