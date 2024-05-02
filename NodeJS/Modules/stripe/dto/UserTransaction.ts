export interface UserTransaction {
  id: number
  userId: number
  transactionId?: number
  paymentHistoryId?: number
  amount: number
  balance: number
  currency: string
  createdAt: Date
}
