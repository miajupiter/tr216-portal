module.exports = (socket) => {
  socket.lastPong = new Date()
  socket.isAlive = true
  // devLog('pong <:', socket.lastPong)
  
  if (socket.clientId && socket.clientSession) {

    db.sessions.updateOne({_id:socket.clientSession._id }, {
      $set: {
        lastOnline: socket.lastPong,
        lastUuid: socket.id,
        lastIP: socket.ip,
      }
    })
      .then(()=>{})
      .catch(errorLog)

  }
}
