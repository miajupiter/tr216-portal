const controllerName = path.basename(__filename, '.socket.js')
const auth = require('../../lib/auth')
module.exports = (socket, data) => {
  auth
    .verify(data.token || '')
    .then((decoded) => {
      db.sessions
        .findOne({ _id: decoded.sessionId })
        .then((sessionDoc) => {
          if (dbNull(sessionDoc, socket.sendError)) {
            if (sessionDoc.closed) {
              socket.sendError('Session closed', data)
            } else {
              sessionDoc.lastOnline = new Date()
              sessionDoc.lastIP = socket.ip
              sessionDoc.socketId = socket.id
              sessionDoc
                .save()
                .then((sessionDoc) => {
                  socket.clientSession = sessionDoc
                  socket.subscribed = true
                  socket.clientId = sessionDoc.member
                  socket.wss.socketListByClientId[sessionDoc.member] = socket
                  socket.sendSuccess('subscribed', {
                    socketId: socket.id,
                    clientId: socket.clientId,
                    clientSessionId: sessionDoc._id.toString(),
                    message: 'Subscription was successful',
                  })
                })
                .catch(socket.sendError)
            }
          }
        })
        .catch(socket.sendError)
    })
    .catch(socket.sendError)
}
