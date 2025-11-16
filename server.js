#!/usr/bin/env node
import 'dotenv/config.js'

import process from 'node:process'

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import {createCluster} from 'addok-cluster'

import createRouter from './lib/router.js'
import {loadServerConfig} from './lib/config.js'

const PORT = process.env.PORT || 5000

const config = await loadServerConfig()

const app = express()

const cluster = await createCluster({
  onTerminate(reason) {
    console.log(`Cluster terminated: ${reason}`)
    process.exit(0)
  }
})

app.disable('x-powered-by')

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

app.use(cors({origin: true}))

app.use('/', createRouter({cluster, config}))

const httpServer = app.listen(PORT, () => {
  console.log(`Start listening on port ${PORT}`)
})

// Graceful shutdown on SIGTERM and SIGINT
async function handleShutdown(signal) {
  console.log(`Received ${signal}, gracefully shutting down...`)

  // Close HTTP server first
  httpServer.close(() => {
    console.log('Server closed')
  })

  // Then terminate the cluster
  try {
    await cluster.end()
  } catch (error) {
    console.error('Error during cluster shutdown:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'))
process.on('SIGINT', () => handleShutdown('SIGINT'))
