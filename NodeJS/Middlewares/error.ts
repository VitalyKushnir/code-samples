import { sendResponse as send } from '@utils/apiResponse'
import { CustomError } from '@utils/error'
import logger from '@utils/logger'
import { Context, Next } from 'koa'

export const errorHandler = async (ctx: Context, next: Next) => {
  try {
    await next()
  } catch (err: unknown) {
    if (err instanceof Error) {
      const defaultMessage = 'Internal server error'
      const originalMessage = err.message || defaultMessage

      if (err instanceof CustomError && err.status) {
        ctx.status = err.status
      } else {
        ctx.status = 500
        err.message = process.env.NODE_ENV === 'production' ? defaultMessage : originalMessage
      }

      logger.error(originalMessage)
      logger.error(err.stack)

      send({
        status: err instanceof CustomError && err.status ? err.status : 500,
        error: err.message,
        ctx,
      })

      ctx.app.emit('error', err, ctx)
    } else {
      throw err
    }
  }
}
