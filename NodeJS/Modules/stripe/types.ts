import { StripePaymentMethodEnum } from '@types'

export type StripeAccountSetParams = {
  code: string
}

export type StripeRedirectOAuthParams = {
  redirect: string
  email?: string
  userId?: string
}

export type TransactionListRequest = {
  search?: string
  orderBy?:
    | 'bankAccount'
    | 'amount'
    | 'currency'
    | 'status'
    | 'description'
    | 'transactionTime'
    | 'assignedTo'
    | 'assignedAt'
  orderType?: 'asc' | 'desc'
  status?: 'assigned' | 'unassigned'
  page: number
  perPage: number
}

export type TransactionUserListRequest = {
  search?: string
  orderBy?: 'businessName' | 'email' | 'fullName'
  orderType?: 'asc' | 'desc'
  page: number
  perPage: number
}

export type SetDefaultMethodService = {
  method: StripePaymentMethodEnum
  value: string
}

export type StripeError = {
  response: {
    data: {
      error: string
    }
  }
}

export type StripePaymentError = {
  raw: {
    message: string
  }
}
