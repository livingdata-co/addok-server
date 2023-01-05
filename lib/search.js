import process from 'node:process'

const ADDOK_FILTERS = process.env.ADDOK_FILTERS ? process.env.ADDOK_FILTERS.split(',') : []

export async function csv({cluster, reverse}) {
  const operation = reverse ? 'reverse' : 'geocode'

  return async (req, res) => {
    const params = {
      lon: req.query.lon ? Number.parseFloat(req.query.lon) : undefined,
      lat: req.query.lat ? Number.parseFloat(req.query.lat) : undefined,
      limit: req.query.limit ? Number.parseInt(req.query.limit, 10) : 5,
      filters: {}
    }

    if (operation === 'geocode') {
      params.q = req.query.q
      params.autocomplete = req.query.autocomplete !== '0'
    }

    for (const filter of ADDOK_FILTERS) {
      params.filters[filter] = req.query[filter]
    }

    const results = await cluster[operation](params)

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
