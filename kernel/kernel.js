var createError = require('http-errors')
var express = require('express')
var bodyParser = require('body-parser')
var logger = require('morgan')
var favicon = require('serve-favicon')
var methodOverride = require('method-override')
var cookieParser = require('cookie-parser')
var app = express()
var cors = require('cors')

module.exports = () => new Promise(async (resolve, reject) => {
  app.use(cors())
  app.use(favicon(path.join(__dirname, 'favicon.ico')))

  process.env.NODE_ENV === 'development' && app.use(logger('tiny'))

  app.use(bodyParser.json({ limit: "500mb" }))
  app.use(bodyParser.urlencoded({ limit: "500mb", extended: true, parameterLimit: 50000 }))

  app.use(cookieParser())
  app.use(methodOverride())

  app.set('port', process.env.HTTP_PORT)

  app.use('/portal', express.static(path.join(__root, 'portal')))
  app.use('/', express.static(path.join(__root, 'solid')))

  global.restControllers = {
    auth: await util.moduleLoader(path.join(__dirname, '/controllers/auth'), '.controller.js'),
    master: await util.moduleLoader(path.join(__dirname, '/controllers/master'), '.controller.js'),
    repo: await util.moduleLoader(path.join(__dirname, '/controllers/repo'), '.controller.js'),
    session: await util.moduleLoader(path.join(__dirname, '/controllers/session'), '.controller.js'),
  }


  global.staticValues = loadJSONFile(path.join(__dirname, '/resources/static-values.json'))
  global.portalModules = loadJSONFile(path.join(__dirname, '/resources/portal-modules.json'))
  global.version = '20210916'
  global.fileImporter = require('./lib/file-importer')
  global.documentHelper = require('./lib/document-helper')
  global.printHelper = require('./lib/print-helper')
  global.programs = require('./services/programs/programs')
  // global.auth = require('./lib/rest-helper')(config.passport_api)

  
  require('./routes')(app)
  resolve(app)
  eventLog(`[RestAPI]`.cyan, 'started')

})
