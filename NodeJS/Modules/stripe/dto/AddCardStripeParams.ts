/**
 * @swagger
 * components:
 *   schemas:
 *    AddCardStripeParams:
 *      type: object
 *      required:
 *       - number
 *      properties:
 *        number:
 *          type: integer
 *          description: Number
 *        exp_month:
 *          type: string
 *          description: Expiration number
 *          example: 1
 *        exp_year:
 *          type: string
 *          description: Expiration year
 *          example: 90
 *        cvc:
 *          type: string
 *          description: Secure code
 *          example: 123
 */
export type AddCardStripeParams = {
  number: number
  exp_month: string
  exp_year: string
  cvc: string
}
