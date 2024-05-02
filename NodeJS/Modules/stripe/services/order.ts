import { config } from '@config'
import { Lot } from '@modules/auction/dto'
import { createNotificationService } from '@modules/notifications/services'
import { Order } from '@modules/orders/dto'
import {
  createPaymentHistory,
  createShippingHistory,
  findOrdersWithAllStatuses,
} from '@modules/orders/repository'
import { getFeeService } from '@modules/stripe/services/fee'
import {
  NotificationRuleAliasEnum,
  OrderPaymentStatus,
  OrderShipmentStatus,
  StripePaymentMethodEnum,
} from '@types'
import { currencyAmountFormatter, NotFoundError } from '@utils'
import { SendGridGroups } from '@utils/sendGrid'
import Stripe from 'stripe'

export const sendPayOrderNotifications = (order: Order, lot: Lot) => {
  const params = {
    orderId: order.id,
    paymentAmount: currencyAmountFormatter(order.totalAmount),
  }

  return [
    createNotificationService({
      alias: NotificationRuleAliasEnum.orderPaidSeller,
      title: 'Payment confirmed',
      message: `Payment of ${params.paymentAmount} confirmed for order #${order.id}`,
      user: lot.userId,
      status: OrderPaymentStatus.paid,
      templateParams: { ...params, orderLink: `${config.FRONTEND.DOMAIN}/orders/${order.id}` },
      groupId: SendGridGroups.payment_notifications_seller,
    }),
    createNotificationService({
      alias: NotificationRuleAliasEnum.orderPaid,
      title: 'Payment confirmed',
      message: `We have successfully processed your payment of ${params.paymentAmount} for the order #${order.id}.`,
      user: order.userId,
      status: OrderPaymentStatus.paid,
      templateParams: {
        ...params,
        scheduleLink: `${config.FRONTEND.DOMAIN}/orders/${order.id}/schedule-pickup`,
      },
      groupId: SendGridGroups.payment_notifications_buyer,
    }),
  ]
}

export const paymentSucceed = async (
  orderIds: number[],
  data: Stripe.Event.Data | Record<string, never>,
  method: StripePaymentMethodEnum
) => {
  const orders = await findOrdersWithAllStatuses({ ids: orderIds })
  if (orders.length < orderIds.length) {
    throw new NotFoundError('Some of orders were not found')
  }

  const totalAmount = orders.reduce((acc, current) => acc + current.totalAmount, 0)
  const fee = getFeeService(totalAmount, method)

  const paymentHistoryId = await createPaymentHistory(
    {
      status: OrderPaymentStatus.paid,
      response: data,
      paymentSource: 'stripe',
      method,
      fee,
    },
    orderIds
  )

  await Promise.all(
    orders
      .map(order => [
        createShippingHistory({
          orderId: order.id,
          status: OrderShipmentStatus.awaitingShipment,
          shippingSource: 'unknown',
        }),
        ...sendPayOrderNotifications(order, order.lot),
      ])
      .flat()
  )

  return paymentHistoryId
}
