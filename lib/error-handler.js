import process from 'node:process'

export default function errorHandler(err, req, res, _next) {
  if (err) {
    const statusCode = err.statusCode || 500
    const exposeError = statusCode !== 500

    res
      .status(statusCode)
      .send({
        code: statusCode,
        message: exposeError ? err.message : 'An unexpected error has occurred'
      })

    if (statusCode === 500 && process.env.NODE_ENV !== 'test') {
      console.error(err)
    }
  }
}
