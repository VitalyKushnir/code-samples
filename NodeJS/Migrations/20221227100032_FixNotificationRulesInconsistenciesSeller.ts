import { NotificationRule } from '@modules/notifications/dto'
import { User } from '@modules/user/dto'
import { NotificationRuleAliasEnum, NotificationRuleTypeEnum, RoleEnum } from '@types'
import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  const allSellers = await knex<User>('users')
    .leftJoin('userRoles', 'userRoles.userId', 'users.id')
    .leftJoin('roles', 'userRoles.roleId', 'roles.id')
    .where({ 'roles.code': RoleEnum.seller })
    .distinct('users.id')
    .select('users.id')

  if (!allSellers.length) {
    return
  }

  const notificationRules = await knex<NotificationRule>('notificationRules')
    .whereIn('alias', [
      NotificationRuleAliasEnum.newBid,
      NotificationRuleAliasEnum.auctionClosed,
      NotificationRuleAliasEnum.ordersConsolidated,
      NotificationRuleAliasEnum.accountVerified,
    ])
    .select('id')

  await knex.raw(`
    DELETE FROM "userNotificationRules"
    WHERE
      "userId" IN (${allSellers.map(seller => seller.id).join(',')}) AND
      "notificationRuleId" IN (${notificationRules.map(rule => rule.id).join(',')})
  `)

  await knex<NotificationRule>('notificationRules')
    .where('notificationRules.alias', NotificationRuleAliasEnum.ordersConsolidatedSeller2)
    .del()

  await knex<NotificationRule>('notificationRules')
    .update({ type: NotificationRuleTypeEnum.buyer })
    .whereIn('alias', [
      NotificationRuleAliasEnum.newBid,
      NotificationRuleAliasEnum.auctionClosed,
      NotificationRuleAliasEnum.ordersConsolidated,
      NotificationRuleAliasEnum.accountVerified,
    ])

  await knex<NotificationRule>('notificationRules')
    .update({ description: 'When a new bid placed' })
    .where('alias', NotificationRuleAliasEnum.newBidSeller)
  await knex<NotificationRule>('notificationRules')
    .update({ description: 'When orders are consolidated' })
    .where('alias', NotificationRuleAliasEnum.ordersConsolidatedSeller1)
}

export function down() {
  console.log('No rollback action for this migration')
}
