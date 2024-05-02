import { TransactionStatusEnum } from '@types'

export type Transaction = {
  id: number
  bankAccountId: number
  amount: number
  currency: string
  description: string
  status: TransactionStatusEnum
  stripeId: string
  stripeTime: Date
  createdAt: Date
  updatedAt: Date
}

export type StripeTransaction = Pick<
  Transaction,
  'amount' | 'currency' | 'description' | 'status'
> & {
  id: string
  transacted_at: number
  transaction_refresh: string
}
