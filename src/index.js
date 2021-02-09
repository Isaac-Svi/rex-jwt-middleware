const {
  login,
  registerWithEmailAndPassword,
  protect,
  refresh,
} = require('./auth')
const TokenProcessor = require('./TokenProcessor')

module.exports = {
  login,
  registerWithEmailAndPassword,
  protect,
  refresh,
  TokenProcessor,
}
