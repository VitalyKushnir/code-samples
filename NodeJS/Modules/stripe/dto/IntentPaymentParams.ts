import { StripePaymentMethodEnum } from '@types'

/**
 * @swagger
 * components:
 *   schemas:
 *    IntentPaymentParams:
 *      type: object
 *      required:
 *       - orderIds
 *      properties:
 *        orderIds:
 *          type: array
 *          items:
 *            type: integer
 *            example: 1
 *        cardId:
 *          type: string
 *          description: The id of card of bank account
 *          example: "cc_327468372543274"
 *        method:
 *          type: string
 *          enum: [card, us_bank_account, ach_domestic]
 */
export type IntentPaymentParams = {
  orderIds: number[]
  cardId?: string
  method?: StripePaymentMethodEnum
}
