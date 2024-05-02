import knex from '@db'
import { BankAccount, UserTransaction } from '@modules/stripe/dto'
import { Transaction } from '@modules/stripe/dto/Transaction'
import { OrderPaymentStatus, TransactionStatusEnum } from '@types'
import { omit } from 'lodash'

import { UserStripe } from './dto/UserStripe'
import { TransactionListRequest, TransactionUserListRequest } from './types'

export const createUserStripe = async (params: UserStripe) => {
  return knex<UserStripe>('userStripe').insert(params, '*')
}

export const createOrUpdateUserStripe = async (params: UserStripe) =>
  knex<UserStripe>('userStripe')
    .insert(params, ['accountId', 'sourceId'])
    .onConflict(['userId'])
    .merge(['accountId'])

export const findOneUserStripe = async (params: Partial<UserStripe>) =>
  knex<UserStripe>('userStripe').where(params).select().first()

export const findOneUserBySourceId = async (sourceId: string) =>
  knex<UserStripe>('userStripe')
    .leftJoin('users', 'users.id', 'userStripe.userId')
    .where({ sourceId })
    .select()
    .first()

export const updateUserStripe = async (params: Partial<UserStripe>) =>
  knex<UserStripe>('userStripe').update(params).where({ userId: params.userId })

export const createBankAccount = async (params: Partial<BankAccount>) =>
  knex<BankAccount>('bankAccounts').insert(params, '*')

export const updateBankAccount = async (id: number, data: Partial<BankAccount>) =>
  knex<BankAccount>('bankAccounts').where({ id }).update(data)

export const removeAllBankAccounts = async () => knex<BankAccount>('bankAccounts').del()

export const fetchBankAccounts = async () => knex<BankAccount>('bankAccounts').select()

export const fetchPendingTransactions = (bankAccountId: number) => {
  return knex<Transaction>('transactions')
    .where({ status: TransactionStatusEnum.pending })
    .andWhere({ bankAccountId })
    .select('transactions.*')
}

export const findOneTransaction = (id: number) =>
  knex<Transaction>('transactions').where({ id }).select().first()

export const insertTransactions = (data: Partial<Transaction>) =>
  knex<Transaction>('transactions').insert(data)

export const updateTransaction = (id: number, params: Partial<Transaction>) =>
  knex<Transaction>('transactions').where({ id }).update(params)

export const findOneUserTransaction = (params: Partial<UserTransaction>) =>
  knex<UserTransaction>('userTransactions').where(params).first()

export const fetchLastUserTransaction = (userId: number) =>
  knex<UserTransaction>('userTransactions').where({ userId }).orderBy('id', 'desc').first()

export const createUserTransaction = (data: Partial<UserTransaction>) =>
  knex<UserTransaction>('userTransactions').insert(data)
