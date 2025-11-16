import multer from 'multer'
import express from 'express'

import {search} from './search.js'
import {batch} from './batch.js'
import {csv} from './csv.js'
import w from './w.js'
import errorHandler from './error-handler.js'

export default function createRouter(options) {
  const {cluster, filters, attribution, license} = options
  const upload = multer()
  const router = new express.Router()

  router.get('/search', w(search({
    cluster,
    filters,
    attribution,
    license
  })))
  router.get('/reverse', w(search({
    cluster,
    reverse: true,
    filters,
    attribution,
    license
  })))

  router.post('/batch', express.json(), w(batch({cluster, filters})))

  router.post('/search/csv', upload.single('data'), w(csv({cluster, filters})))
  router.post('/reverse/csv', upload.single('data'), w(csv({cluster, reverse: true, filters})))

  router.use(errorHandler)

  return router
}
