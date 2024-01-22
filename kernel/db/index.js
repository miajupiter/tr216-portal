global.mongoose = require('mongoose')
global.mongoosePaginate = require('mongoose-paginate-v2')
global.mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2')
mongoosePaginate.paginate.options = {
  customLabels: {
    totalDocs: 'totalDocs',
    limit: 'pageSize',
    page: 'page',
    totalPages: 'pageCount',
    docs: 'docs',
    nextPage: 'false',
    prevPage: 'false',
    pagingCounter: 'false',
    hasPrevPage: 'false',
    hasNextPage: 'false',
    meta: null,
  },
  lean: true,
  leanWithId: false,
  limit: 10,
  allowDiskUse: true,
}
global.ObjectId = mongoose.Types.ObjectId

global.dbNull = require('./helpers/db-util').dbNull
global.epValidateSync = require('./helpers/db-util').epValidateSync
global.sendToTrash = require('./helpers/db-util').sendToTrash

// global.dbType = require('./db-types')

// global.userDbHelper = require('./userdb-helper')

mongoose.set('debug', false)
mongoose.Schema.Types.String.set('trim', true)

process.on('SIGINT', function () {
  mongoose.connection.close(function () {
    eventLog('Mongoose default connection disconnected through app termination')
    process.exit(0)
  })
})

global.db = {
  get nameLog() {
    return `[MongoDB]`.cyan
  },
}

module.exports = () =>
  new Promise((resolve, reject) => {
    connectMongoDatabase(
      'collections/master',
      process.env.MONGODB_MAINDB_URI,
      db
    )
      .then(() => {
        initRepoDb()
        resolve()
      })
      .catch(reject)
  })

global.repoHolder = {}

var serverList = {}

function connectRepoDb(mongoAddress) {
  var repoConn = mongoose.createConnection(mongoAddress, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    autoIndex: true,
  })
  repoConn.on('connected', () =>
    eventLog(
      `[Mongo UserDB]`.cyan,
      `${mongoAddress.brightBlue} ${'connected'.brightGreen}`
    )
  )
  repoConn.on('error', (err) =>
    errorLog(`${mongoAddress.brightBlue} Error:`, err)
  )
  repoConn.on('disconnected', () =>
    eventLog(`${mongoAddress.brightBlue} disconnected`)
  )
  return repoConn
}

function initRepoDb() {
  collectionLoader(path.join(__dirname, 'collections/repo'), '.collection.js')
    .then((holder) => {
      global.repoHolder = holder
      if (process.env.MONGODB_SERVER1_URI) {
        serverList.server1 = connectRepoDb(process.env.MONGODB_SERVER1_URI)
      }
      if (process.env.MONGODB_SERVER2_URI) {
        serverList.server2 = connectRepoDb(process.env.MONGODB_SERVER2_URI)
      }
      if (process.env.MONGODB_SERVER3_URI) {
        serverList.server3 = connectRepoDb(process.env.MONGODB_SERVER3_URI)
      }
    })
    .catch((err) => {
      errorLog('refreshRepoDb:', err)
    })
}

global.getRepoDbModel = (memberId, dbName, dbServer) =>
  new Promise((resolve, reject) => {
    let dbModel = {
      get nameLog() {
        return `[${dbName}]`.cyan
      },
    }
    dbModel.memberId = memberId
    dbModel.dbName = dbName
    
    if (serverList[dbServer]) {
      dbModel.conn = serverList[dbServer].useDb(dbName)

      dbModel.free = function () {
        Object.keys(dbModel.conn.models).forEach((key) => {
          delete dbModel.conn.models[key]
          if (dbModel.conn.collections[key] != undefined)
            delete dbModel.conn.collections[key]
          if (dbModel.conn.base != undefined) {
            if (dbModel.conn.base.modelSchemas != undefined)
              if (dbModel.conn.base.modelSchemas[key] != undefined)
                delete dbModel.conn.base.modelSchemas[key]
          }
        })
      }

      Object.keys(repoHolder).forEach((key) => {
        Object.defineProperty(dbModel, key, {
          get: function () {
            if (dbModel.conn.models[key]) {
              return dbModel.conn.models[key]
            } else {
              return repoHolder[key](dbModel)
            }
          },
        })
      })

      resolve(dbModel)
    } else {
      reject(`server: ${dbServer} not supported`)
    }
  })

  
function connectMongoDatabase(collectionFolder, mongoAddress, dbObj) {
  return new Promise((resolve, reject) => {
    if (collectionFolder && mongoAddress && !dbObj.conn) {
      collectionLoader(path.join(__dirname, collectionFolder), '.collection.js')
        .then((holder) => {
          dbObj.conn = mongoose.createConnection(mongoAddress, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            autoIndex: true,
          })
          dbObj.conn.on('connected', () => {
            Object.keys(holder).forEach((key) => {
              dbObj[key] = holder[key](dbObj)
            })
            if (dbObj.conn.active != undefined) {
              eventLog(dbObj.nameLog, 're-connected')
            } else {
              eventLog(dbObj.nameLog, mongoAddress, 'connected')
            }
            dbObj.conn.active = true
            resolve(dbObj)
          })

          dbObj.conn.on('error', (err) => {
            dbObj.conn.active = false
            reject(err)
          })

          dbObj.conn.on('disconnected', () => {
            dbObj.conn.active = false
            eventLog(dbObj.nameLog, 'disconnected')
          })
        })
        .catch((err) => {
          reject(err)
        })
    } else {
      resolve(dbObj)
    }
  })
}

function collectionLoader(folder, suffix) {
  return new Promise((resolve, reject) => {
    try {
      let collectionHolder = {}
      let files = fs.readdirSync(folder)
      files.forEach((e) => {
        let f = path.join(folder, e)
        if (!fs.statSync(f).isDirectory()) {
          let fileName = path.basename(f)
          let apiName = fileName.substr(0, fileName.length - suffix.length)
          if (apiName != '' && apiName + suffix == fileName) {
            collectionHolder[apiName] = require(f)
          }
        }
      })
      resolve(collectionHolder)
    } catch (err) {
      reject(err)
    }
  })
}
