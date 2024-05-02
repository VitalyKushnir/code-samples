import { sendResponse } from '@utils/apiResponse'
import { Context } from 'koa'

import {
  paymentWebhookService,
  stripeACHWebhookService,
  stripeTransactionsWebhookService,
  topUpWebhookService,
} from '../services/webhook'

export const stripePaymentWebhook = async (ctx: Context) => {
  await paymentWebhookService(ctx)
  return sendResponse({ ctx })
}

export const stripeTopUpWebhook = async (ctx: Context) => {
  await topUpWebhookService(ctx)
  return sendResponse({ ctx })
}

export const stripeACHWebhook = async (ctx: Context) => {
  await stripeACHWebhookService(ctx)
  return sendResponse({ ctx })
}

export const stripeTransactionsWebhook = async (ctx: Context) => {
  await stripeTransactionsWebhookService(ctx)
  return sendResponse({ ctx })
}
