const checkFields = (schema, fields) => {
  for (field of fields) {
    if (!schema[field]) throw new Error('Field not present in schema')
  }
  return true
}

const checkExtra = (schema, input) => {
  for (i in input) {
    if (!schema[i]) throw new Error('Field not from schema present')
  }
  return true
}

const checkRequired = (key, schema, input) => {
  const { required, default: d } = schema[key]
  const isDefaultNull = d === null || d === undefined

  if (required && isDefaultNull && !input[key]) throw new Error(`${key} missing`)

  if (!required && !input[key]) return false

  return true
}

const checkType = (key, schema, input) => {
  // checks for simple schemas and arrays, but need to also check for nested schemas
  const type = typeof (schema[key].type
    ? schema[key].type
    : schema[key][0].type
    ? schema[key][0].type
    : schema[key][0])()

  if (input[key] && type !== typeof input[key])
    throw new Error(`${key} must be a valid ${type}`)

  return true
}

const checkMinLength = (key, schema, input) => {
  const minLength = schema[key].minLength
  if (!minLength) return
  if (minLength > input[key].length)
    throw new Error(`${key} must be at least ${minLength} characters long`)
}

const checkMaxLength = (key, schema, input) => {
  const maxLength = schema[key].maxLength
  if (!maxLength) return
  if (maxLength < input[key].length)
    throw new Error(`${key} must be under ${maxLength + 1} characters long`)
}

const validateSchema = (schema, input) => {
  try {
    // check if any extra fields are present in input
    checkExtra(schema, input)

    for (let key in schema) {
      // check if required key is present, and if it is, whether a default is provided
      // if field isn't required or provided, returns false, and we go to next key
      if (!checkRequired(key, schema, input)) continue

      // check if field is of proper type
      checkType(key, schema, input)

      // check if minLength is correct
      checkMinLength(key, schema, input)

      // check if maxLength is correct
      checkMaxLength(key, schema, input)
    }

    return true
  } catch (err) {
    throw new Error(err.message)
  }
}

module.exports = {
  validateSchema,
  checkFields,
}
