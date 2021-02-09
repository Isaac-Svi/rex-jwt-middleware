# rex-jwt-middleware

JWT based authentication middleware for your express project.

# Installation

`npm i rex-jwt-middleware`

Then ...

```javascript
app.use(
  new TokenProcessor({
    refreshToken: {
      secret: REFRESH_TOKEN_SECRET,
      exp: 20 * 60, // Number of seconds from epoch
      route: '/api/refresh',
      cookieName: 'rex',
    },
    accessToken: {
      secret: ACCESS_TOKEN_SECRET,
      exp: 10,
    },
  })
)
```
