import onFinished from 'on-finished'
import createError from 'http-errors'

export function ensureSingleValue(value) {
  if (Array.isArray(value)) {
    return value.at(-1)
  }

  return value
}

export function parseFilterValues(filterName, value, maxValues) {
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
  const unique = [...new Set(trimmed)]

  // Validate maxValues
  if (maxValues && unique.length > maxValues) {
    throw createError(400, `Too many values for filter "${filterName}" (max: ${maxValues})`)
  }

  return unique
}

export function formatParams({query, operation, filters: availableFilters}) {
  const params = {
    lon: query.lon ? Number.parseFloat(ensureSingleValue(query.lon)) : undefined,
    lat: query.lat ? Number.parseFloat(ensureSingleValue(query.lat)) : undefined,
    limit: query.limit ? Number.parseInt(ensureSingleValue(query.limit), 10) : 5,
    filters: {}
  }

  if (operation === 'geocode') {
    params.q = ensureSingleValue(query.q)
    params.autocomplete = ensureSingleValue(query.autocomplete) !== '0'
  }

  for (const [filterName, filterConfig] of Object.entries(availableFilters)) {
    const values = parseFilterValues(filterName, query[filterName], filterConfig.maxValues)

    if (values.length > 0) {
      params.filters[filterName] = values
    }
  }

  return params
}

export function createFeatureCollection({params, operation, results, attribution, license}) {
  const fc = {
    type: 'FeatureCollection',
    features: results
  }

  // Add optional fields only if they are defined
  if (attribution) {
    fc.attribution = attribution
  }

  if (license) {
    fc.license = license
  }

  fc.query = params.q
  fc.filters = Object.keys(params.filters).length > 0 ? params.filters : undefined
  fc.center = params.lon && params.lat ? [params.lon, params.lat] : undefined
  fc.limit = operation === 'geocode' ? params.limit : 1

  if (operation === 'geocode') {
    fc.query = params.q
  }

  return fc
}

export function search({cluster, reverse, filters, attribution, license}) {
  const operation = reverse ? 'reverse' : 'geocode'

  return async (req, res) => {
    const params = formatParams({query: req.query, operation, filters})

    const ac = new AbortController()
    onFinished(res, () => ac.abort()) // Abort the batch request if the client disconnects

    const results = await cluster[operation](params, {signal: ac.signal, priority: 'high'})
    const result = createFeatureCollection({
      params,
      operation,
      results,
      attribution,
      license
    })

    res.send(result)
  }
}
