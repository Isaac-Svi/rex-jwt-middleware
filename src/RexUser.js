const { compare, hash } = require('bcryptjs')
const { verify } = require('jsonwebtoken')
const cookie = require('cookie')
const mongoose = require('mongoose')
const { validateSchema, checkFields } = require('./ValidateSchema')

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

  const fields = (publicFields) => {
    try {
      if (checkFields(userSchema.paths, publicFields)) {
        return (req, res, next) => {
          res.locals.publicFields = publicFields
          next()
        }
      }
    } catch (err) {
      console.error(err.message)
    }
  }

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

      let { publicFields: fields } = res.locals
      fields = fields || ['email']

      const userInfo = {}
      fields.forEach((field) => {
        userInfo[field] = foundUser[field]
      })

      res.status(200).send({
        userInfo,
        accessToken: tokens.generateAccessToken({
          id: foundUser._id,
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
      if (!email || !password) throw new Error('Insufficient credentials provided')

      // default is 6
      if (password.length < 6) throw new Error('Password must be at least 6 characters long')

      password = await hash(password, 10)

      validateSchema(schema, { ...req.body, email, password })

      const foundUser = await User.findOne({ email })
      if (foundUser) {
        res.status(400)
        throw new Error('Email already taken')
      }

      await User.create({
        ...req.body,
        email,
        password,
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

      if (decoded.exp * 1000 <= Date.now()) {
        res.status(401)
        throw new Error('Token expired')
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
    const { [cookieName]: refreshToken } = cookie.parse(String(req.headers.cookie))

    if (!refreshToken) {
      return res.send({
        ok: false,
        error: 'no cookie',
        userInfo: {},
        accessToken: '',
      })
    }

    let payload = null
    try {
      payload = verify(refreshToken, secret)
    } catch (err) {
      console.log(err.message)
      return res.json({
        ok: false,
        accessToken: '',
        userInfo: {},
        error: err.message,
      })
    }

    const user = await User.findById(payload.id)

    if (!user)
      return res.send({
        ok: false,
        accessToken: '',
        userInfo: {},
        error: 'no user',
      })

    if (user.tokenVersion !== payload.tokenVersion)
      return res.send({
        ok: false,
        accessToken: '',
        userInfo: {},
        error: 'expired version',
      })

    user.tokenVersion += 1
    await user.save()

    tokens.sendRefreshToken(
      res,
      tokens.generateRefreshToken({
        id: user._id,
        tokenVersion: user.tokenVersion,
      })
    )

    let { publicFields: fields } = res.locals
    fields = fields || ['email']

    const userInfo = {}
    fields.forEach((field) => {
      userInfo[field] = user[field]
    })

    return res.send({
      ok: true,
      userInfo,
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

  return { login, register, protect, refresh, logout, fields, User }
}

module.exports = RexUser
