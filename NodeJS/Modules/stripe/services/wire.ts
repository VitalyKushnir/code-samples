import { config } from '@config'
import { BankAccountClient, StripeTransaction, Transaction, UserStripe } from '@modules/stripe/dto'
import { TransactionStatusEnum } from '@types'
import { BadRequestError, CustomError, NotFoundError } from '@utils'
import { stripe } from '@utils'
import logger from '@utils/logger'
import axios from 'axios'
import { pick } from 'lodash'

import {
  createBankAccount,
  fetchBankAccounts,
  fetchLastUserTransaction,
  fetchPendingTransactions,
  fetchTransactions,
  fetchUsersForTransactionAssign,
  findOneTransaction,
  findOneUserTransaction,
  insertTransactions,
  updateBankAccount,
  updateTransaction,
  updateUserStripe,
} from '../repository'
import { StripeError, TransactionListRequest, TransactionUserListRequest } from '../types'
import { findOrCreateSystemStripeUser } from './customer'

export const fetchRefreshedTransactionsService = async (refreshId: string) => {
  const [bankAccount] = await fetchBankAccounts()
  if (!bankAccount) {
    logger.warn('You have no connected account')
    return
  }

  let response
  try {
    let url = `https://api.stripe.com/v1/financial_connections/transactions?account=${bankAccount.stripeAccountId}&limit=100`
    if (bankAccount.transactionRefresh) {
      url = `${url}&transaction_refresh[after]=${bankAccount.transactionRefresh}`
    }
    response = await axios.get(url, {
      headers: {
        'Stripe-Version': '2020-08-27; financial_connections_transactions_beta=v1',
        Authorization: `Bearer ${config.Stripe.secretKey}`,
      },
    })
  } catch (err: unknown) {
    console.log((err as StripeError).response.data.error)
  }

  if (response) {
    await updateBankAccount(bankAccount.id, {
      transactionRefresh: refreshId,
    })

    const goodTransactions = response.data.data.filter(
      (trx: StripeTransaction) => trx.amount > 0 && trx.status !== TransactionStatusEnum.void
    )

    if (goodTransactions.length) {
      const pendingTransactions: Transaction[] = await fetchPendingTransactions(bankAccount.id)

      const updatedTransactionStatuses: Record<number, TransactionStatusEnum> = {}
      const transactions = goodTransactions.reduce(
        (
          acc: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[],
          transaction: StripeTransaction
        ) => {
          const addNewTransaction = () =>
            acc.push({
              ...pick(transaction, ['currency', 'description', 'status']),
              bankAccountId: bankAccount.id,
              stripeId: transaction.id,
              stripeTime: new Date(transaction.transacted_at * 1000),
              amount: transaction.amount / 100,
            })

          if (transaction.status !== TransactionStatusEnum.pending) {
            const candidate = pendingTransactions.find(i => i.stripeId === transaction.id)
            if (candidate && candidate.id) {
              updatedTransactionStatuses[candidate.id] = transaction.status
            } else {
              addNewTransaction()
            }
          } else {
            addNewTransaction()
          }

          return acc
        },
        []
      )

      try {
        await Promise.all(
          Object.entries(updatedTransactionStatuses).map(([id, status]) =>
            updateTransaction(+id, { status })
          )
        )
        logger.info('Existing transactions are updated')

        await insertTransactions(transactions)
        logger.info('New transactions are created')

        logger.info('Transactions are parsed')
      } catch (err) {
        console.log(err)
        logger.error('Transaction updating is failed')
      }
    }
  }
}

export const getDomesticAccountService = async (user: UserStripe, email: string) => {
  if (!user.sourceId || user.sourceId.length < 1) {
    const source = await stripe.sources.create({
      type: 'ach_credit_transfer',
      currency: 'usd',
      owner: { email: config.Stripe.testEmail || email },
    })
    await stripe.customers.createSource(user.accountId, {
      source: source.id,
    })

    await updateUserStripe({ ...user, sourceId: source.id })
    return source
  }

  return stripe.sources.retrieve(user.sourceId)
}

export const fetchBankAccountsService = () => {
  return fetchBankAccounts()
}

export const getBankAccountSessionService = async () => {
  const systemUser = await findOrCreateSystemStripeUser()

  const session = await stripe.financialConnections.sessions.create({
    account_holder: {
      type: 'customer',
      customer: systemUser.accountId,
    },
    permissions: ['transactions', 'ownership', 'payment_method'],
    filters: {
      countries: ['US'],
    },
  })

  return {
    clientSecret: session.client_secret,
    sessionId: session.id,
  }
}

export const createBankAccountService = async (sessionId: string, account: BankAccountClient) => {
  const accounts = await fetchBankAccounts()
  if (accounts.length) {
    throw new BadRequestError('You already have an account')
  }

  const session = await stripe.financialConnections.sessions.retrieve(sessionId)

  const fcAccounts = session.accounts.data
  if (!fcAccounts.length) {
    throw new CustomError('You have no accounts connected via financial connections')
  }

  await createBankAccount({
    ...account,
    stripeAccountId: fcAccounts[0].id,
  })
}

export const refreshTransactions = async () => {
  const [bankAccount] = await fetchBankAccounts()
  if (!bankAccount) {
    logger.warn('You have no connected account')
    return
  }

  try {
    const url = `https://api.stripe.com/v1/financial_connections/accounts/${bankAccount.stripeAccountId}/refresh`

    await axios.post(url, 'features[]=transactions', {
      headers: {
        'Stripe-Version': '2020-08-27; financial_connections_transactions_beta=v1',
        Authorization: `Bearer ${config.Stripe.secretKey}`,
      },
    })
  } catch (err: unknown) {
    console.log((err as StripeError).response.data.error)
  }
}

export const fetchTransactionsService = (params: TransactionListRequest) => {
  return fetchTransactions({
    ...params,
    page: params.page || 1,
    perPage: params.perPage || 25,
  })
}

export const fetchUsersForTransactionAssignService = async (params: TransactionUserListRequest) => {
  return fetchUsersForTransactionAssign({
    ...params,
    page: params.page || 1,
    perPage: params.perPage || 25,
  })
}

export const fetchCustomerCreditBalanceService = async (userId: number) => {
  const lastUserTransaction = await fetchLastUserTransaction(userId)
  return lastUserTransaction ? lastUserTransaction.balance : 0
}

export const assignTransactionService = async (userId: number, transactionId: number) => {
  const transaction = await findOneTransaction(transactionId)

  if (!transaction) {
    throw new NotFoundError('Transaction not found')
  }

  if (transaction.status !== TransactionStatusEnum.posted) {
    throw new BadRequestError('Only posted transactions can be assigned to users')
  }

  const userTransaction = await findOneUserTransaction({
    userId,
    transactionId,
  })
  if (userTransaction) {
    throw new BadRequestError(`Transaction is already assigned to user with id #${userId}`)
  }

  const { amount, currency } = transaction
  const paymentIntent = await stripe.topups.create({
    amount: amount * 100,
    currency: 'usd',
    description: `Top-up with funds collected from incoming transaction: ${transactionId}`,
    metadata: {
      transactionId: transaction.id,
      userId,
      currency,
    },
  })

  if (paymentIntent.status === 'pending') {
    await updateTransaction(transaction.id, { status: TransactionStatusEnum.processing })
  } else {
    logger.error(paymentIntent.failure_message)
    throw new CustomError('Transferring funds to stripe account is failed')
  }
}
