module.exports = (dbModel, sessionDoc, req) => new Promise((resolve, reject) => {
	switch (req.method) {
		case 'GET':
			if (req.params.param1 != undefined) {
				if (req.params.param1.indexOf(',') > -1 || req.params.param1.indexOf(';') > -1) {
					getIdList(dbModel, sessionDoc, req).then(resolve).catch(reject)
				} else {
					getOne(dbModel, sessionDoc, req).then(resolve).catch(reject)
				}

			} else {
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

function getList(dbModel, sessionDoc, req) {
	return new Promise((resolve, reject) => {
		let options = {
			page: (req.query.page || 1),
			// select:'-data.data'
		}

		if ((req.query.pageSize || req.query.limit))
			options['limit'] = req.query.pageSize || req.query.limit

		let filter = {}
		options.sort = {
			ts: 1
		}

    if ((req.query.contactId || '') != ''){
      filter['contactId'] =req.query.contactId
    }else{
      return reject({ name: 'INCORRECT_PARAMETER', message: `contactId query parameter is required` })
    }

		if ((req.query.content || '') != '')
			filter['content'] = { $regex: '.*' + req.query.content + '.*', $options: 'i' }

		if ((req.query.search || '').trim() != '') {
			filter['$or'] = [
				{ 'content': { $regex: '.*' + req.query.search + '.*', $options: 'i' } }
			]
		}
    console.log('filter:', filter)
		dbModel.activities.paginate(filter, options).then(resolve).catch(reject)
	})
}

function getIdList(dbModel, sessionDoc, req) {
	return new Promise((resolve, reject) => {
		let filter = {}
		let idList = req.params.param1.replaceAll(';', ',').split(',')

		filter['_id'] = { $in: idList }

		dbModel.activities.find(filter)
			.then(resolve)
			.catch(reject)
	})
}


function getOne(dbModel, sessionDoc, req) {
	return new Promise((resolve, reject) => {
		dbModel.activities.findOne({ _id: req.params.param1 })
			.then(doc => {
				if (dbnull(doc, reject)) {
					resolve(doc)
				}
			})
			.catch(reject)
	})
}

const saveActivity = (dbModel, activity) => new Promise((resolve, reject) => {
  activity._id = activity._id ?? new ObjectId()
  let newDoc = new dbModel.activities(activity)
  if (!epValidateSync(newDoc, reject)) return
  newDoc.save().then(resolve).catch(reject)
})

const saveTargetActivity = (dbModel, activity) => new Promise((resolve, reject) => {
  db.members.findOne({ username: activity.contactId })
    .then(targetMember => {
      if (targetMember != null) {
        global.getRepoDbModel(targetMember._id, targetMember.db, targetMember.dbHost)
          .then(dbTarget => {
            let targetSocket = null
            let targetActivity = activity.toJSON()
            delete targetActivity._id
            targetActivity.contactId = socket.memberInfo.username
            targetActivity.senderId = socket.memberInfo.username
            if (targetMember.lastUuid && global.socketClients[targetMember.lastUuid]) {
              targetSocket = global.socketClients[targetMember.lastUuid]
              targetActivity.status = 'delivered'
            }

            saveActivity(dbTarget, targetActivity)
              .then(async newDoc2 => {
                if (targetSocket) {

                  let obj = {
                    _id: newDoc2._id.toString(),
                    ts: newDoc2.ts,
                    isGroup: newDoc2.isGroup == true ? 1 : 0,
                    dateGroup: newDoc2.dateGroup,
                    contactId: newDoc2.contactId,
                    senderId: newDoc2.senderId,
                    contentType: newDoc2.contentType,
                    content: newDoc2.content,
                    status: newDoc2.status,
                  }

                  targetSocket.emit('newActivity', obj)
                }

                resolve(newDoc2)
              })
              .catch(reject)
          })
          .catch(reject)
      } else {
        resolve(null)
      }
    })
    .catch(reject)

  
})

function post(dbModel, sessionDoc, req) {


	return new Promise((resolve, reject) => {
		let newActivity = req.body || {}

    newActivity.status = 'sent'
    saveActivity(dbModel, newActivity)
    .then(activityDoc => {

      saveTargetActivity(socket, dbModel, activityDoc)
        .then(trg => {
         eventLog('saveTargetActivity', trg)
          if (trg) {
            activityDoc.status = 'delivered'
            activityDoc.save()
          }
          resolve(activityDoc)
        })
        .catch(err => {
         errorLog('saveTargetActivity err:', err)
          resolve(activityDoc)
        })
    })
    .catch(err => {
      reject(err)
    })
	})
}

function put(dbModel, sessionDoc, req) {
	return new Promise((resolve, reject) => {
		if (req.params.param1 == undefined)
			return restError.param1(req, reject)
		let data = req.body || {}
		data._id = req.params.param1
		data.modifiedDate = new Date()

		dbModel.activities.findOne({ _id: data._id })
			.then(doc => {
				if (dbnull(doc, reject)) {
					let doc2 = Object.assign(doc, data)
					let newDoc = new dbModel.activities(doc2)

					if (!epValidateSync(newDoc, reject))
						return
					newDoc.save().then(resolve).catch(reject)
				}
			})
			.catch(reject)
	})
}

function deleteItem(dbModel, sessionDoc, req) {
	return new Promise((resolve, reject) => {
		if (req.params.param1 == undefined)
			return restError.param1(req, next)
		let data = req.body || {}
		data._id = req.params.param1
		dbModel.activities.removeOne(sessionDoc, { _id: data._id }).then(resolve).catch(reject)
	})
}