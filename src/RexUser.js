const { compare, hash } = require('bcryptjs')
const { verify } = require('jsonwebtoken')
const cookie = require('cookie')
const mongoose = require('mongoose')
const validateRegisterInfo = require('./ValidateSchema')

const RexUser = (schema) => {
  const userSchema = mongoose.Schema(
    {
      ...schema,
      tokenVersion: {
        type: Number,
        required: true,
        default: 0,
      },
    },
    {
      timestamps: true,
    }
  )
  const User = mongoose.model('User', userSchema)

  async function login(req, res, next) {
    const { email, password } = req.body
    const { tokens } = req

    try {
      if (!email || !password) throw new Error('Insufficient credentials')

      const foundUser = await User.findOne({ email })
      if (!foundUser) {
        throw new Error("User doesn't exist")
      }

      const validPwd = await compare(password, foundUser.password)
      if (!validPwd) {
        throw new Error('Invalid credentials')
      }

      tokens.sendRefreshToken(
        res,
        tokens.generateRefreshToken({
          id: foundUser._id,
          tokenVersion: foundUser.tokenVersion,
        })
      )

      res.status(200).send({
        accessToken: tokens.generateAccessToken({
          id: foundUser.id,
          email: foundUser.email,
        }),
      })
    } catch (err) {
      res.send({ error: err.message })
    }
  }

  async function register(req, res, next) {
    let { email, password } = req.body

    try {
      password = await hash(password, 10)

      validateRegisterInfo(schema, { email, password, ...req.body })

      const foundUser = await User.findOne({ email })
      if (foundUser) {
        res.status(400)
        throw new Error('Email already taken')
      }

      await User.create({
        email,
        password,
        ...req.body,
      })

      res.status(201).send({ msg: 'User created successfully' })
    } catch (err) {
      res.send({ error: err.message })
    }
  }

  async function protect(req, res, next) {
    let token
    try {
      token = req.headers.authorization && req.headers.authorization.split(' ')[1]

      if (!token) {
        res.status(401)
        throw new Error('No token')
      }

      const decoded = verify(token, req.tokens.accessToken.secret)

      if (!decoded || !decoded.id) {
        res.status(401)
        throw new Error('Malformed token')
      }

      const userExists = await User.findById(decoded.id)

      if (!userExists) {
        res.status(400)
        throw new Error("User doesn't exist")
      }

      next()
    } catch (err) {
      res.json({ error: err.message })
    }
  }

  async function refresh(req, res, next) {
    const { tokens } = req
    const { cookieName, secret } = tokens.refreshToken
    const { [cookieName]: refreshToken } = cookie.parse(
      String(req.headers.cookie)
    )

    if (!refreshToken) {
      return res.send({ ok: false, error: 'no cookie', accessToken: '' })
    }

    let payload = null
    try {
      payload = verify(refreshToken, secret)
    } catch (err) {
      console.log(err.message)
      return res.json({ ok: false, accessToken: '', error: err.message })
    }

    const user = await User.findById(payload.id)

    if (!user) return res.send({ ok: false, accessToken: '', error: 'no user' })

    if (user.tokenVersion !== payload.tokenVersion)
      return res.send({ ok: false, accessToken: '', error: 'expired version' })

    user.tokenVersion += 1
    await user.save()

    tokens.sendRefreshToken(
      res,
      tokens.generateRefreshToken({
        id: user._id,
        tokenVersion: user.tokenVersion,
      })
    )

    return res.send({
      ok: true,
      accessToken: tokens.generateAccessToken({
        id: user._id,
        email: user.email,
      }),
    })
  }

  async function logout(req, res, next) {
    const { tokens } = req
    tokens.sendRefreshToken(res, '')
    res.status(200).send({ ok: true })
  }

  return { login, register, protect, refresh, logout }
}

module.exports = RexUser
