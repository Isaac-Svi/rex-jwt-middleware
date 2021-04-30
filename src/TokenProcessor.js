const { sign } = require('jsonwebtoken')
const cookie = require('cookie')

class TokenProcessor {
  constructor({ accessToken, refreshToken }) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken

    return (req, res, next) => {
      req.tokens = this
      next()
    }
  }

  generateAccessToken(payload) {
    const { secret, exp } = this.accessToken
    return sign({ ...payload, exp: Math.floor(Date.now() / 1000) + exp }, secret)
  }

  generateRefreshToken(payload) {
    const { secret, exp } = this.refreshToken
    return sign({ ...payload, exp: Math.floor(Date.now() / 1000) + exp }, secret)
  }

  sendRefreshToken(res, token) {
    const { cookieName, route, exp } = this.refreshToken

    res.setHeader(
      'Set-Cookie',
      cookie.serialize(cookieName, token, {
        path: route,
        httpOnly: true,
        expires: !token ? 1 : new Date(Date.now() + exp * 1000),
      })
    )
  }
}

module.exports = TokenProcessor
