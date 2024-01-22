const auth = require('./lib/auth')
const spamCheck = require('./lib/spam-detector')

module.exports = (app) => {
  app.all('/api/*', (req, res, next) => {
    req.IP =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress || ''
    req.getValue = (key) => {
      return req.headers[key] || req.body[key] || req.query[key] || ''
    }

    next()
  })

  const apiWelcomeMessage = {
    message: process.env.RESTAPI_WELCOME,
    status: process.env.NODE_ENV || '',
  }

  app.all('/api', function (req, res) {
    res.status(200).json({ success: true, data: apiWelcomeMessage })
  })

  app.all('/api/v1', function (req, res) {
    res.status(200).json({ success: true, data: apiWelcomeMessage })
  })

  authControllers(app, '/api/v1/auth/:func/:param1/:param2/:param3')
  sessionControllers(app, '/api/v1/session/:func/:param1/:param2/:param3')
  repoControllers(app, '/api/v1/db/:func/:param1/:param2/:param3')
  masterControllers(app, '/api/v1/:func/:param1/:param2/:param3')

  app.use((req, res, next) => {
    res.status(404).json({ success: false, error: 'Not found' })
  })

  app.use((err, req, res, next) => {
    sendError(err, req, res)
  })
}

function authControllers(app, route) {
  setRoutes(app, route, (req, res, next) => {
    let spam = spamCheck(req.IP)
    if (!spam) {
      if (restControllers.auth[req.params.func]) {
        restControllers.auth[req.params.func](req)
          .then((data) => {
            if (data == undefined) res.json({ success: true })
            else if (data == null) res.json({ success: true })
            else {
              res.status(200).json({
                success: true,
                data: data,
              })
            }
          })
          .catch(err=>{
            console.log(err)
            next(err)
          })
      } else next()
    } else {
      next(`Suspicious login attempts. Try again after ${spam} seconds.`)
    }
  })
}

function sessionControllers(app, route) {
  setRoutes(app, route, (req, res, next) => {
    if (restControllers.session[req.params.func]) {
      passport(req)
        .then((sessionDoc) => {
          restControllers.session[req.params.func](db, sessionDoc, req)
            .then((data) => {
              if (data == undefined) res.json({ success: true })
              else if (data == null) res.json({ success: true })
              else {
                res.status(200).json({ success: true, data: data })
              }
            })
            .catch(next)
        })
        .catch(next)
    } else next()
  })
}

function repoControllers(app, route) {
  setRoutes(app, route, (req, res, next) => {
    if (restControllers.repo[req.params.func]) {
      passport(req)
        .then((sessionDoc) => {
          sessionDoc
            .populate('dbId')
            .then((sessionDoc) => {
              if (sessionDoc.dbId) {
                getRepoDbModel(
                  sessionDoc.member,
                  sessionDoc.dbId.dbName,
                  sessionDoc.dbId.dbServer
                )
                  .then((dbModel) => {
                    console.log('dbModel.dbName:', dbModel.dbName)

                    restControllers.repo[req.params.func](
                      dbModel,
                      sessionDoc,
                      req
                    )
                      .then((data) => {
                        if (data == undefined) res.json({ success: true })
                        else if (data == null) res.json({ success: true })
                        else {
                          res.status(200).json({ success: true, data: data })
                        }
                      })
                      .catch(next)
                  })
                  .catch(next)
              } else next('Database not selected')
            })
            .catch(next)
        })
        .catch(next)
    } else next()
  })
}

function masterControllers(app, route) {
  setRoutes(app, route, (req, res, next) => {
    if (restControllers.master[req.params.func]) {
      passport(req)
        .then((sessionDoc) => {
          restControllers.master[req.params.func](db, sessionDoc, req)
            .then((data) => {
              if (data == undefined) res.json({ success: true })
              else if (data == null) res.json({ success: true })
              else {
                res.status(200).json({ success: true, data: data })
              }
            })
            .catch(next)
        })
        .catch((err) => {
          res.status(401).json({ success: false, error: err })
        })
    } else next()
  })
}

// function getController(folder, funcName) {
//   let controllerName = path.join(
//     __dirname,
//     '/controllers',
//     folder,
//     `${funcName}.controller.js`
//   )
//   if (fs.existsSync(controllerName) == false) {
//     return null
//   } else {
//     return require(controllerName)
//   }
// }

function sendError(err, req, res) {
  let errorMessage = 'Error'
  let statusCode = 400
  if (typeof err == 'string') {
    errorMessage = err
  } else {
    if (err.message) errorMessage = err.message
  }

  let response = { success: false, error: errorMessage }

  if (errorMessage.toLowerCase().includes('not found')) {
    statusCode = 404
  } else {
    let baseUrl = req.route.path.split('/:func')[0]
    let ctl = baseUrl.substring('/api/v1'.length + 1)
    let func = req.url
      .substring(baseUrl.length + 1)
      .split('?')[0]
      .split('/')[0]
    response.docUrl = `${process.env.ERROR_DOCUMENTATION_URI}?ctl=${ctl}&func=${func}`
  }

  res.status(statusCode).json(response)
}

function setRoutes(app, route, cb1, cb2) {
  let dizi = route.split('/:')
  let yol = ''
  dizi.forEach((e, index) => {
    if (index > 0) {
      yol += `/:${e}`
      if (cb1 != undefined && cb2 == undefined) {
        app.all(yol, cb1)
      } else if (cb1 != undefined && cb2 != undefined) {
        app.all(yol, cb1, cb2)
      }
    } else {
      yol += e
    }
  })
}

function passport(req) {
  return new Promise((resolve, reject) => {
    let token = req.headers.token || req.body.token || req.query.token
    if (token) {
      auth
        .verify(token)
        .then((decoded) => {
          db.sessions
            .findOne({ _id: decoded.sessionId })
            .then((sessionDoc) => {
              if (sessionDoc) {
                if (sessionDoc.closed) {
                  reject('Session closed')
                } else {
                  sessionDoc.lastOnline = new Date()
                  sessionDoc.lastIP = req.IP
                  sessionDoc.save().then(resolve).catch(reject)
                }
              } else {
                reject('Session not found')
              }
            })
            .catch(reject)
        })
        .catch(reject)
    } else {
      reject('Authentication failed. Access token required')
    }
  })
}

global.restError = {
  param1: function (req, next) {
    next(`function:[/${req.params.func}] [/:param1] is required`)
  },
  param2: function (req, next) {
    next(
      `function:[/${req.params.func}/${req.params.param1}] [/:param2] is required`
    )
  },
  method: function (req, next) {
    next(`function:${req.params.func} WRONG METHOD: ${req.method}`)
  },
  auth: function (req, next) {
    next(`Authentication failed`)
  },
  data: function (req, next, field) {
    if (field) {
      next(`'${field}' Incorrect or missing data`)
    } else {
      next(`Incorrect or missing data`)
    }
  },
}
