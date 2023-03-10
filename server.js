#!/usr/bin/env node
import 'dotenv/config.js'

import process from 'node:process'

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import {createCluster} from 'addok-cluster'

import routes from './lib/routes.js'

const PORT = process.env.PORT || 5000

const app = express()
const cluster = await createCluster()

app.disable('x-powered-by')

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

app.use(cors({origin: true}))

app.use('/', routes(cluster))

app.listen(PORT, () => {
  console.log(`Start listening on port ${PORT}`)
})
