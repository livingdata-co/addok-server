/* eslint-disable unicorn/numeric-separators-style */

export const featureA = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [
      3.045433,
      50.630992
    ]
  },
  properties: {
    label: 'Lille',
    score: 0.9603027272727271,
    id: '59350',
    type: 'municipality',
    name: 'Lille',
    postcode: '59000',
    citycode: '59350',
    x: 703219.96,
    y: 7059335.72,
    population: 234475,
    city: 'Lille',
    context: '59, Nord, Hauts-de-France',
    importance: 0.56333
  }
}

export const featureB = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [
      0.644113,
      44.150456
    ]
  },
  properties: {
    label: 'Lille 47550 Boé',
    score: 0.8587463636363636,
    id: '47031_s42lp2',
    name: 'Lille',
    postcode: '47550',
    citycode: '47031',
    x: 511569.99,
    y: 6341861.1,
    city: 'Boé',
    context: '47, Lot-et-Garonne, Nouvelle-Aquitaine',
    type: 'street',
    importance: 0.44621
  }
}

const features = [featureA, featureB]

function filterGeocodeParams(properties, params) {
  const {label, citycode, postcode, type} = properties
  const {q, filters} = params
  const isLabelIncludesQ = label.toLowerCase().includes(q.toLowerCase())

  if (isLabelIncludesQ) {
    if (filters?.citycode) {
      return citycode === filters.citycode
    }

    if (filters?.postcode) {
      return postcode === filters.postcode
    }

    if (filters?.type) {
      return type === filters.type
    }

    return true
  }
}

function filterReverseParams(geometry, params) {
  const {coordinates} = geometry
  const {lon, lat} = params

  return lon && lat && lon === coordinates[0] && lat === coordinates[1]
}

export function mockCluster() {
  return {
    geocode(params) {
      return features.filter(({properties}) => filterGeocodeParams(properties, params))
    },
    reverse(params) {
      return features.filter(({geometry}) => filterReverseParams(geometry, params))
    }
  }
}
