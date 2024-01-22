module.exports = (dbModel, sessionDoc, req) =>
  new Promise(async (resolve, reject) => {
    // console.log('dataLog.controller.js: ', dbModel.dbName)
    console.log('dataLog  req.params:', req.params)
    console.log('dataLog  req.query:', req.query)
    // console.log('dataLog  sessionDoc:', sessionDoc)
    switch (req.method) {
      case 'GET':
        if (req.params.param1 != undefined) {
          getOne(dbModel, sessionDoc, req).then(resolve).catch(reject)
        } else {
          console.log('buraya geldi1')
          getList(dbModel, sessionDoc, req).then(resolve).catch(reject)
        }
        break
      case 'POST':
        post(dbModel, sessionDoc, req).then(resolve).catch(reject)

        break
      case 'PUT':
        put(dbModel, sessionDoc, req).then(resolve).catch(reject)
        break
      case 'DELETE':
        deleteItem(dbModel, sessionDoc, req).then(resolve).catch(reject)
        break
      default:
        restError.method(req, reject)
        break
    }
  })

function getOne(dbModel, sessionDoc, req) {
  return new Promise((resolve, reject) => {
    dbModel.dataLog
      .findOne({ _id: req.params.param1 })
      .then(resolve)
      .catch(reject)
  })
}

function getList(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    let options = {
      page: req.query.page ||  1,
      limit: req.query.pageSize ||  10,
    }

    let filter = {}
    if ((req.query.transferred || '') != '') {
      filter.transferred = req.query.transferred
    }

    if ((req.query.machine || '') != '') {
      filter.machine = req.query.machine
    }
    console.log('buraya geldi')
    let deneme=await dbModel.dataLog.find()
    console.log(deneme)
    dbModel.dataLog.paginate(filter, options).then(resolve).catch(reject)
  })
}

function post(dbModel, sessionDoc, req) {
  return new Promise((resolve, reject) => {
    let data = req.body || {}
    data._id = undefined
    let newDoc = new dbModel.dataLog(data)

    if (!epValidateSync(newDoc, reject)) return
    newDoc.save().then(resolve).catch(reject)
  })
}

function put(dbModel, sessionDoc, req) {
  return new Promise((resolve, reject) => {
    if (req.params.param1 == undefined) return restError.param1(req, reject)
    let data = req.body || {}
    delete data._id
    
    dbModel.dataLog
      .findOne({ _id: req.params.param1 })
      .then((doc) => {
        if (dbnull(doc, reject)) {
          let newDoc=Object.assign(doc,data)
          // let newDoc=new dbModel.dataLog(Object.assign({}, doc.toJSON(), data))
          if (!epValidateSync(newDoc, (err)=>{
            reject(err)
          })) return
          newDoc.save().then(resp=>{
            console.log('resp:',resp)
            resolve(resp)
          }).catch(err=>{
            console.log(err)
            reject(err)
          })
        }
      })
      .catch(err=>{
        console.log(err)
        reject(err)
      })
  })
}

function deleteItem(dbModel, sessionDoc, req) {
  return new Promise((resolve, reject) => {
    if (req.params.param1 == undefined) return restError.param1(req, next)
    let data = req.body || {}
    data._id = req.params.param1
    // dbModel.dataLog
    //   .deleteOne({ _id: req.params.param1 })
    //   .then(resolve)
    //   .catch(reject)
    dbModel.dataLog.removeOne(member, { _id: data._id }).then(resolve).catch(err=>{
      console.log(err)
      reject(err)
    })
  })
}
