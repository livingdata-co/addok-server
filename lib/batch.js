import createError from 'http-errors'

export function batch({cluster}) {
  return async (req, res) => {
    const {requests} = req.body

    if (!Array.isArray(requests)) {
      throw createError(400, 'requests is a required param (array)')
    }

    if (requests.length > 100) {
      throw createError(400, 'requests must not contains more than 100 items')
    }

    for (const r of requests) {
      if (!['geocode', 'reverse'].includes(r.operation)) {
        throw createError(400, 'operation must be one of geocode or reverse')
      }

      if (!r.params) {
        throw createError(400, 'params is required for each requests item')
      }
    }

    const baseParams = {limit: 2, autocomplete: false}
    const globalParams = req.body.params ? {...req.body.params, ...baseParams} : baseParams

    const results = await Promise.all(requests.map(async r => {
      const {operation, params, id} = r

      try {
        const rParams = {...params, ...globalParams}
        const operationResult = await cluster[operation](rParams)

        if (operationResult.length === 0) {
          return {
            id,
            status: 'not-found'
          }
        }

        const result = {
          ...operationResult[0].properties,
          next_score: operationResult[1] ? operationResult[1].properties.score : undefined,
          lon: operationResult[0].geometry.coordinates[0],
          lat: operationResult[0].geometry.coordinates[1]
        }

        return {
          id,
          status: 'ok',
          result
        }
      } catch (error) {
        console.error(error)
        return {
          id,
          status: 'error',
          error: error.message
        }
      }
    }))

    res.send({results})
  }
}
