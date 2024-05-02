import { User } from '@modules/user/dto'
import { decodeToken, getUserWithRoles } from '@modules/user/services'
import { Context, Next } from 'koa'

export const authJwtMiddleware = async (ctx: Context, next: Next) => {
  const { authorization } = ctx.headers

  if (!authorization) {
    return next()
  }

  const token = authorization.split('Bearer ')[1]
  const decodedUser = decodeToken<User>(token)
  if (!decodedUser) {
    ctx.throw(401, 'Token expired or wrong')
  }

  const user = await getUserWithRoles(decodedUser.id)
  if (!user) {
    ctx.throw(401, 'User not found')
  }

  user.roleCode = user.roles[0].code
  ctx.user = user
  return next()
}
