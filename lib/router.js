import multer from 'multer'
import express from 'express'

import {search} from './search.js'
import {batch} from './batch.js'
import {csv} from './csv.js'
import w from './w.js'
import errorHandler from './error-handler.js'

export default function createRouter(options) {
  const {cluster} = options
  const upload = multer()
  const router = new express.Router()

  router.get('/search', w(search({cluster})))
  router.get('/reverse', w(search({cluster, reverse: true})))

  router.post('/batch', express.json(), w(batch({cluster})))

  router.post('/search/csv', upload.single('data'), w(csv({cluster})))
  router.post('/reverse/csv', upload.single('data'), w(csv({cluster, reverse: true})))

  router.use(errorHandler)

  return router
}
