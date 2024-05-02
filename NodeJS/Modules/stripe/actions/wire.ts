import { TransactionListRequest, TransactionUserListRequest } from '@modules/stripe/types'
import { getUserWithRoles } from '@modules/user/services'
import { RoleEnum } from '@types'
import { BadRequestError } from '@utils'
import { sendResponse, SUCCESS_CREATED_MESSAGE, SUCCESS_UPDATED_MESSAGE } from '@utils/apiResponse'
import { Context } from 'koa'

import {
  assignTransactionService,
  createBankAccountService,
  fetchBankAccountsService,
  fetchTransactionsService,
  fetchUsersForTransactionAssignService,
  getBankAccountSessionService,
} from '../services'

/**
 * @swagger
 * /admin/stripe/bank/account/list:
 *  get:
 *    description: Fetch system bank accounts
 *    summary: Fetch system bank accounts
 *    tags:
 *      - Admin Panel
 *    security:
 *      - bearerAuth: []
 *    responses:
 *      200:
 *        description: Returns error or ok
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                statusCode:
 *                  type: integer
 *                  example: 200
 *                data:
 *                  type: array
 *                  items:
 *                    type: object
 *                    $ref: '#/components/schemas/BankAccount'
 */
export const fetchBankAccounts = async (ctx: Context) => {
  return sendResponse({
    ctx,
    data: await fetchBankAccountsService(),
  })
}

/**
 * @swagger
 * /admin/stripe/bank/account/session:
 *  get:
 *    description: Fetch client secret for financial connections auth
 *    summary: Fetch client secret
 *    tags:
 *      - Admin Panel
 *    security:
 *      - bearerAuth: []
 *    responses:
 *      200:
 *        description: Returns error or ok
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                statusCode:
 *                  type: integer
 *                  example: 200
 *                data:
 *                  type: object
 *                  properties:
 *                    clientSecret:
 *                      type: string
 *                      example: "fcsess_client_secret_3ZWOgIRxAWYyJV6H36jCDYVF"
 *                    sessionId:
 *                      type: string
 *                      example: "fcsess_1Ln316DFAnJw4ZCMgp5ZQMrc"
 */
export const getBankAccountSession = async (ctx: Context) => {
  return sendResponse({
    ctx,
    data: await getBankAccountSessionService(),
  })
}

/**
 * @swagger
 * /admin/stripe/bank/account/create:
 *  post:
 *    description: Add a bank account to system
 *    summary: Add a bank account to system
 *    tags:
 *      - Admin Panel
 *    security:
 *      - bearerAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              sessionId:
 *                type: string
 *                example: "fcsess_1Ln3DfDFAnJw4ZCMDTPVxj9C"
 *              account:
 *                type: object
 *                $ref: '#/components/schemas/BankAccountClient'
 *    responses:
 *      200:
 *        description: Returns error or ok
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                statusCode:
 *                  type: integer
 *                  example: 200
 */
export const createBankAccount = async (ctx: Context) => {
  const { sessionId, account } = ctx.request.body

  await createBankAccountService(sessionId, account)
  return sendResponse({
    ctx,
    data: { message: SUCCESS_CREATED_MESSAGE },
  })
}

/**
 * @swagger
 * /admin/stripe/transaction/list:
 *  get:
 *    description: Fetch transactions
 *    tags:
 *      - Admin Panel
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: query
 *        name: search
 *        required: false
 *        description: Search transactions by amount, description, email or buyer's name
 *        schema:
 *          type: string
 *          example: ""
 *      - in: query
 *        name: orderBy
 *        required: false
 *        schema:
 *          type: string
 *          example: "bankAccount"
 *          enum: [bankAccount, amount, currency, status, description, transactionTime, assignedTo, assignedAt]
 *      - in: query
 *        name: orderType
 *        required: false
 *        schema:
 *          type: string
 *          example: "asc"
 *          enum: [asc, desc]
 *      - in: query
 *        name: status
 *        required: false
 *        description: Transaction status
 *        schema:
 *          type: string
 *          example: "assigned"
 *          enum: [assigned, unassigned]
 *      - in: query
 *        name: page
 *        required: false
 *        schema:
 *          type: integer
 *          example: 1
 *      - in: query
 *        name: perPage
 *        required: false
 *        schema:
 *          type: integer
 *          example: 10
 *    responses:
 *      200:
 *        description: Returns error or ok
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                statusCode:
 *                  type: integer
 *                  example: 200
 *                data:
 *                  type: object
 *                  properties:
 *                    items:
 *                      type: array
 *                      items:
 *                        type: object
 *                        properties:
 *                          id:
 *                            type: integer
 *                            example: 2
 *                          bankAccountId:
 *                            type: integer
 *                            example: 1
 *                          bankAccountName:
 *                            type: string
 *                            example: "BOfA account for international transfers"
 *                          amount:
 *                            type: integer
 *                            example: 120000
 *                            description: Amount in cents
 *                          currency:
 *                            type: string
 *                            example: "used"
 *                          description:
 *                            type: string
 *                            example: "Description"
 *                          stripeTime:
 *                            type: Date
 *                            example: "2022-05-25T17:54:10.307+00:00"
 *                          status:
 *                            type: string
 *                            example: "posted"
 *                          assignedTo:
 *                            type: string
 *                            example: "John Doe"
 *                          assignedAt:
 *                            type: Date
 *                            example: "2022-05-25T17:54:10.307+00:00"
 *                    total:
 *                      type: integer
 *                      example: 35
 */
export const fetchTransactions = async (ctx: Context) => {
  return sendResponse({
    ctx,
    data: await fetchTransactionsService(ctx.query as unknown as TransactionListRequest),
  })
}

/**
 * @swagger
 * /admin/stripe/transaction/user/list:
 *  get:
 *    description: Fetch user for transaction assign
 *    tags:
 *      - Admin Panel
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: query
 *        name: search
 *        required: false
 *        description: Search users by business name, email or full name
 *        schema:
 *          type: string
 *          example: ""
 *      - in: query
 *        name: orderBy
 *        required: false
 *        schema:
 *          type: string
 *          example: "businessName"
 *          enum: [businessName, email, fullName, orderCount]
 *      - in: query
 *        name: orderType
 *        required: false
 *        schema:
 *          type: string
 *          example: "asc"
 *          enum: [asc, desc]
 *      - in: query
 *        name: page
 *        required: false
 *        schema:
 *          type: integer
 *          example: 1
 *      - in: query
 *        name: perPage
 *        required: false
 *        schema:
 *          type: integer
 *          example: 10
 *    responses:
 *      200:
 *        description: Returns error or ok
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                statusCode:
 *                  type: integer
 *                  example: 200
 *                data:
 *                  type: object
 *                  properties:
 *                    items:
 *                      type: array
 *                      items:
 *                        type: object
 *                        properties:
 *                          id:
 *                            type: integer
 *                            example: 2
 *                          businessName:
 *                            type: integer
 *                            example: "LLC of Everything"
 *                          email:
 *                            type: string
 *                            example: "john.doe@gmail.com"
 *                          fullName:
 *                            type: string
 *                            example: "John Doe"
 *                          orderCount:
 *                            type: integer
 *                            example: 2
 *                    total:
 *                      type: integer
 *                      example: 35
 */
export const fetchUsersForTransactionAssign = async (ctx: Context) => {
  return sendResponse({
    ctx,
    data: await fetchUsersForTransactionAssignService(
      ctx.query as unknown as TransactionUserListRequest
    ),
  })
}

/**
 * @swagger
 * /admin/stripe/transaction/assign:
 *  post:
 *    description: Assign stripe transaction to buyer's credit balance
 *    summary: Assign stripe transaction
 *    tags:
 *      - Admin Panel
 *    security:
 *      - bearerAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *             - userId
 *             - transactionId
 *            properties:
 *              userId:
 *                type: integer
 *                example: 1
 *              transactionId:
 *                type: integer
 *                example: 2
 *    responses:
 *      200:
 *        description: Returns error or ok
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                statusCode:
 *                  type: integer
 *                  example: 200
 */
export const assignTransaction = async (ctx: Context) => {
  const { userId, transactionId } = ctx.request.body

  const user = await getUserWithRoles(userId)
  if (user && !user.roles.find(role => role.code === RoleEnum.buyer)) {
    throw new BadRequestError('Transaction can be assigned to buyer only, check user id')
  }

  await assignTransactionService(userId, transactionId)
  return sendResponse({
    ctx,
    data: { message: SUCCESS_UPDATED_MESSAGE },
  })
}
