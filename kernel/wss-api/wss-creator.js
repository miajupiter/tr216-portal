const WebSocketServer = require('ws').WebSocketServer
const url = require('url')
const uuid = require('uuid')
const v8 = require('v8')

module.exports = function (options) {
  return new Promise(async (resolve, reject) => {
    const moduleHolder = await util.moduleLoader(
      options.controllerPath,
      '.socket.js'
    )
    var webSocketServer = new WebSocketServer(options)
    webSocketServer.socketListByUuid = {}
    webSocketServer.socketListByClientId = {}

    webSocketServer.on('connection', (socket, req) => {
      socket.wss = webSocketServer
      socket.ip = (
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        socket.conn.remoteAddress ||
        ''
      )
        .split(',')[0]
        .trim()
      socket.isAlive = true
      socket.lastPong = new Date()
      socket.id = uuid.v4()
      socket.pathname = url.parse(req.url).pathname
      socket.subscribed = false
      socket.sendError = (err, callback) => sendError(socket, err, callback)
      socket.sendSuccess = (event, data, callback) =>
        sendSuccess(socket, event, data, callback)
      socket.pingIntervalId = setInterval(
        () => socket.ping(),
        process.env.WSS_PING_INTERVAL || 30000
      )

      socket.callbackList = {}
      socket.clientId = null
      socket.clientSession = null
      socket.on('pong', () => moduleHolder.pong(socket))

      socket.on('message', (message) => {
        try {
          let data = JSON.parse(message.toString())

          if (data.callback && socket.callbackList[data.callback]) {
            socket.callbackList[data.callback](data)
          } else {
            // if (
            //   !['error', 'pong', 'subscribe'].includes(data.event) &&
            //   !socket.subscribed
            // ) {
            //   socket.sendError('Authentication failed')
            // } else if (data.event && moduleHolder[data.event]) {

            if (data.event && moduleHolder[data.event]) {
              moduleHolder[data.event](socket, data)
            } else {
              errorLog(
                `[WssAPI] error`.cyan,
                `Function not found: ${data.event}`
              )
              socket.sendError('Function not found')
            }
          }
        } catch (err) {
          errorLog('[WssAPI] error'.cyan, err)
        }
      })

      socket.on('error', (err) => {
        errorLog('[WssAPI] error'.cyan, err)
      })

      socket.on('close', (code, reason) => {
        devLog(`[WssAPI] onclose:`.cyan, code, reason.toString())
        delete webSocketServer.socketListByUuid[socket.id]
        purgeSocket(socket)

        eventLog(`Total client:`, webSocketServer.clients.size)
      })

      devLog('Connected', socket.ip, socket.id)
      eventLog(`Total client:`, webSocketServer.clients.size)

      webSocketServer.socketListByUuid[socket.id] = socket
    })

    eventLog(`[WssAPI]`.cyan, 'started')
    resolve()
  })
}

global.purgeSocket = (socket) => {
  try {
    delete socket.wss.socketListByUuid[socket.id]
    socket.clientId && delete socket.wss.socketListByClientId[socket.clientId]
    clearInterval(socket.timeIntervalId)
    clearInterval(socket.pingIntervalId)
    socket.terminate()
  } catch (err) {
    console.error(err)
  }
}

function sendError(socket, err, callback) {
  let error = 'Error'
  if (typeof err == 'string') {
    error = err
  } else if (typeof err == 'object') {
    error = err.message || err.name || 'Error'
  }

  const obj = {
    event: 'error', // qwerty  We will look back here again.
    success: false,
    error: error,
    callback: callback ?? undefined,
  }
  devError(`[SendError]`.cyan, JSON.stringify(obj))
  socket.send(JSON.stringify(obj))
}

function sendSuccess(socket, event, data, callback) {
  const obj = {
    event: event,
    success: true,
    data: data,
    callback: callback ?? undefined,
  }
  socket.send(JSON.stringify(obj), new Date().getTime())
}
