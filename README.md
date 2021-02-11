# rex-jwt-middleware

rex-jwt-middleware is a package made with the intention to take care of a lot of the boilerplate code for basic user authentication with JWT's, using bcryptjs, jsonwebtoken, cookie, and mongoose.

# Contents

- [Installation](#installation)
- [Setup](#setup)
  - [Token Setup](#token-setup)
  - [Token Parameters](https://github.com/Isaac-Svi/rex-jwt-middleware#token-parameters)
  - [User Model](https://github.com/Isaac-Svi/rex-jwt-middleware#user-model)
- [Use](https://github.com/Isaac-Svi/rex-jwt-middleware#Use)
  - [Authentication Routes](https://github.com/Isaac-Svi/rex-jwt-middleware#routes)
  - [Refresh Route](https://github.com/Isaac-Svi/rex-jwt-middleware#refresh-route)
  - [Protected Route](https://github.com/Isaac-Svi/rex-jwt-middleware#protected-route)
- [Description](https://github.com/Isaac-Svi/rex-jwt-middleware#description)

# Installation <a name="installation"></a>
`npm i rex-jwt-middleware`
`yarn add rex-jwt-middleware`

# Setup <a name="setup"></a>
(I'll describe how this all works in the next sections.)
 
### Add the following next to all other express middleware: <a name="token-setup"></a>
```javascript
const { TokenProcessor } = require('rex-jwt-middleware')

app.use(new TokenProcessor({
	refreshToken: {
		secret: process.env.REFRESH_TOKEN_SECRET,
		exp: 20 * 60, // Number of seconds from epoch
		route: '/api/refresh',
		cookieName: 'rex',
	},
	accessToken: {
		secret: process.env.ACCESS_TOKEN_SECRET,
		exp: 10,
	},
}))
```
#### [](https://github.com/Isaac-Svi/rex-jwt-middleware#token-parameters)Parameters:
`refreshToken`
| param | description |
|--|--|
| secret | Random string used to encrypt our refresh token. |
| exp | Number of seconds this token is meant to last. |
| route | Name of route for the cookie containing the refresh token.  This route must match the name of the route used with the `user.refresh` middleware function below. |
| cookieName | Name of the cookie that will contain the refresh token |

`accessToken`
| param | description |
|--|--|
| secret | Random string used to encrypt our access token. |
| exp| Number of seconds this token is meant to last. |


### [](https://github.com/Isaac-Svi/rex-jwt-middleware#user-model)Setting up our User model:
Before creating our routes and using our middleware, we need to initialize the User model for our RexUser by providing a schema.  Adding fields to the schema is done in the same way one can add fields to a mongoose schema.
```javascript
const { RexUser } = require('rex-jwt-middleware')

const user = RexUser({
	email: {
		type:  String,
		min:  6,
		required:  true,
	},
	password: {
		type:  String,
		min:  50,
		required:  true,
	},
})
```
# [](https://github.com/Isaac-Svi/rex-jwt-middleware#Use)Use
### [](https://github.com/Isaac-Svi/rex-jwt-middleware#routes)Adding authentication/registration routes:
These routes can be called anything.  This is just an example:
```javascript
app.post('/api/register', user.registerWithEmailAndPassword)
app.post('/api/login', user.login)
```
### [](https://github.com/Isaac-Svi/rex-jwt-middleware#refresh-route)Adding a route to refresh an expired access token:
We need to add one more route for the refresh token, so that we can send back an access token when the user needs to access protected routes.  This route **must** be the same as the route field in the refreshToken field in the TokenProcessor object above.  Meaning, this route and that can be named whatever you want them to be named, but they have to match.
```javascript
app.post('/api/refresh', user.refresh)
```
### [](https://github.com/Isaac-Svi/rex-jwt-middleware#protected-route)Setting up a protected route:
Protected routes can only be accessed if the user sends us a valid access token.
```javascript
app.get('/secret', user.protect, (req, res) => {
	res.send("here is some secret content")
})
```

# [](https://github.com/Isaac-Svi/rex-jwt-middleware#description)Description of the process:
coming soon