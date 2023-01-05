#!/usr/bin/env node
import 'dotenv/config.js'

import process from 'node:process'

import express from 'express'
import multer from 'multer'
import cors from 'cors'
import morgan from 'morgan'

import {createCluster} from 'addok-cluster'

import {search} from './lib/search.js'
import {batch} from './lib/batch.js'
import {csv} from './lib/csv.js'
import w from './lib/w.js'
import errorHandler from './lib/error-handler.js'

const PORT = process.env.PORT || 5000

const app = express()
const upload = multer()
const cluster = await createCluster()

app.disable('x-powered-by')

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

app.use(cors({origin: true}))

app.get('/search', w(search({cluster})))
app.get('/reverse', w(search({cluster, reverse: true})))

app.post('/batch', express.json(), w(batch({cluster})))

app.post('/search/csv', upload.single('data'), w(csv({cluster})))
app.post('/reverse/csv', upload.single('data'), w(csv({cluster, reverse: true})))

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Start listening on port ${PORT}`)
})
