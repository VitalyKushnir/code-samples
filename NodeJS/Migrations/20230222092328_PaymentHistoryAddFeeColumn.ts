import { PaymentHistory } from '@modules/orders/dto'
import { getFeeOldService } from '@modules/stripe/services'
import { OrderPaymentStatus, StripePaymentMethodEnum } from '@types'
import { Knex } from 'knex'

type PaymentHistoryWithAmount = {
  id: number
  totalAmount: number
  method: StripePaymentMethodEnum
}

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('paymentHistory', table => {
    table.decimal('fee').nullable()
  })

  const paidHistory: PaymentHistoryWithAmount[] = (
    await knex.raw(`
    SELECT
      "paymentHistory".id,
      "paymentHistory"."method",
      SUM("orders"."totalAmount") as "totalAmount"
    FROM "paymentHistory"
    LEFT JOIN "orderPaymentHistory" ON "orderPaymentHistory"."paymentHistoryId" = "paymentHistory".id
    LEFT JOIN "orders" ON "orderPaymentHistory"."orderId" = "orders".id
    WHERE "paymentHistory"."status" = '${OrderPaymentStatus.paid}'
    GROUP BY "paymentHistory".id
  `)
  ).rows

  for (let i = 0; i < paidHistory.length; ++i) {
    const item = paidHistory[i]
    if (item.method) {
      const fee = getFeeOldService(item.totalAmount, item.method)
      await knex<PaymentHistory>('paymentHistory').where({ id: item.id }).update({ fee })
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('paymentHistory', table => {
    table.dropColumn('fee')
  })
}
