import process from 'node:process'

const ADDOK_FILTERS = process.env.ADDOK_FILTERS ? process.env.ADDOK_FILTERS.split(',') : []

function ensureSingleValue(value) {
  if (Array.isArray(value)) {
    return value[value.length - 1]
  }

  return value
}

export function search({cluster, reverse}) {
  const operation = reverse ? 'reverse' : 'geocode'

  return async (req, res) => {
    const params = {
      lon: req.query.lon ? Number.parseFloat(ensureSingleValue(req.query.lon)) : undefined,
      lat: req.query.lat ? Number.parseFloat(ensureSingleValue(req.query.lat)) : undefined,
      limit: req.query.limit ? Number.parseInt(ensureSingleValue(req.query.limit), 10) : 5,
      filters: {}
    }

    if (operation === 'geocode') {
      params.q = ensureSingleValue(req.query.q)
      params.autocomplete = ensureSingleValue(req.query.autocomplete) !== '0'
    }

    for (const filter of ADDOK_FILTERS) {
      params.filters[filter] = ensureSingleValue(req.query[filter])
    }

    const ac = new AbortController()
    req.on('close', () => ac.abort())

    const results = await cluster[operation](params, {signal: ac.signal, priority: 'high'})

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

    res.send(fc)
  }
}
