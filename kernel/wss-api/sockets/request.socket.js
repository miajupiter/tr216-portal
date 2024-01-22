const controllerName = path.basename(__filename, '.socket.js')
module.exports = (socket, request) => {
  if (!request.path)
    return socket.sendError(`Parameter 'path' is required`, request.callback)
  let req = {
    IP: socket.ip,
    headers: request.headers || {},
    method: request.method || 'GET',
    query: request.query || {},
    body: request.body || request.data || {},
    params: {},
  }
  req.getValue = (key) => {
    return req.headers[key] || req.body[key] || req.query[key] || ''
  }

  if (!request.path.startsWith('/api/v1/auth/')) {
    if(request.path=='/api' || request.path=='/api/v1'){
      const apiWelcomeMessage = {
        message: process.env.RESTAPI_WELCOME,
        status: process.env.NODE_ENV || '',
      }
      return socket.sendSuccess(request.event, apiWelcomeMessage, request.callback)
    }else if(!socket.subscribed){
      return socket.sendError(`Authentication failed. Subscribe first`, request.callback)
    }
  }

  if (request.path.startsWith('/api/v1/auth/')) {
    authControllers(socket, request, req)
  } else if (request.path.startsWith('/api/v1/session/')) {
    sessionControllers(socket, request, req)
  } else if (request.path.startsWith('/api/v1/db/')) {
    repoControllers(socket, request, req)
  } else if (request.path.startsWith('/api/v1/')) {
    socket.sendError(`master controllers`, request.callback)
  } else {
    socket.sendError(`ApiPath not found`, request.callback)
  }

  // socket.sendSuccess(controllerName, 'result qwerty', request.callback)
}

function authControllers(socket, request, req) {
  req.params = extractRequestUrlPath('/api/v1/auth/', request.path)
  if (restControllers.auth[req.params.func]) {
    restControllers.auth[req.params.func](req)
      .then((resp) => socket.sendSuccess(request.event, resp, request.callback))
      .catch((err) => socket.sendError(err, request.callback))
  } else {
    socket.sendError(`Function not found`, request.callback)
  }
}

function sessionControllers(socket, request, req) {
  req.params = extractRequestUrlPath('/api/v1/session/', request.path)
  if (restControllers.session[req.params.func]) {
    restControllers.session[req.params.func](db, socket.clientSession, req)
      .then((resp) => socket.sendSuccess(request.event, resp, request.callback))
      .catch((err) => socket.sendError(err, request.callback))
  } else {
    socket.sendError(`Function not found`, request.callback)
  }
}

function repoControllers(socket, request, req) {
  req.params = extractRequestUrlPath('/api/v1/db/', request.path)
  if (restControllers.repo[req.params.func]) {
    socket.clientSession
      .populate('dbId')
      .then((sessionDoc) => {
        getRepoDbModel(
          sessionDoc.member,
          sessionDoc.dbId.dbName,
          sessionDoc.dbId.dbServer
        )
          .then((dbModel) => {
            console.log('dbModel.dbName:', dbModel.dbName)

            restControllers.repo[req.params.func](
              dbModel,
              socket.clientSession,
              req
            )
              .then((resp) =>
                socket.sendSuccess(request.event, resp, request.callback)
              )
              .catch((err) => socket.sendError(err, request.callback))
          })
          .catch((err) => socket.sendError(err, request.callback))
      })
      .catch((err) => socket.sendError(err, request.callback))
  } else {
    socket.sendError(`Function not found`, request.callback)
  }
}

function extractRequestUrlPath(basePath, urlPath) {
  if (urlPath.startsWith(basePath)) {
    let url = urlPath.slice(basePath.length).split('?')[0]
    return {
      func: url.split('/')[0],
      param1: url.split('/')[1] ?? undefined,
      param2: url.split('/')[2] ?? undefined,
      param3: url.split('/')[3] ?? undefined,
    }
  } else {
    return null
  }
}
