const wssCreator=require('./wss-creator')
global.wss=null


module.exports = function (httpServer) {
  return new Promise((resolve, reject) => {
    wssCreator({
      server: httpServer,
      autoAcceptConnections: true,
      skipUTF8Validation:true,
      //port:8801,
      path: '/',
      controllerPath:path.join(__dirname, 'sockets')
    }).then(ws=>{
      global.wss = ws
      resolve()
    })
    .catch(reject)
  })
}
