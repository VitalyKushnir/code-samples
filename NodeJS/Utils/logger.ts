import { createLogger, format, Logger, transports } from 'winston'

const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

const { printf } = format

const consoleFormat = printf(({ level, message }) => {
  return `${level}: ${message}`
})
const fileFormat = printf(({ level, message, timestamp }) => {
  return `${level}: ${message} at ${module.filename} in ${timestamp as string}`
})

const logger: Logger = createLogger({
  level: LOG_LEVEL,
  format: format.json(),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), consoleFormat),
    }),
    new transports.File({
      format: format.combine(format.timestamp(), fileFormat),
      filename: 'error.log',
      level: 'error',
    }),
  ],
})

if (process.env.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new transports.File({
      format: format.combine(format.timestamp(), fileFormat),
      filename: 'exceptions.log',
      level: 'error',
    })
  )
}

export default logger

logger.info(`LOG_LEVEL = ${LOG_LEVEL}`)
