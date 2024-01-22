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
      pinned:1,
			displayName: 1
		}


		if ((req.query.displayName || '') != '')
			filter['displayName'] = { $regex: '.*' + req.query.displayName + '.*', $options: 'i' }

		if ((req.query.search || '').trim() != '') {
			filter['$or'] = [
				{ 'displayName': { $regex: '.*' + req.query.search + '.*', $options: 'i' } }
			]
		}

		dbModel.contacts.paginate(filter, options).then(resolve).catch(reject)
	})
}

function getIdList(dbModel, sessionDoc, req) {
	return new Promise((resolve, reject) => {
		let filter = {}
		let idList = req.params.param1.replaceAll(';', ',').split(',')

		filter['_id'] = { $in: idList }

		dbModel.contacts.find(filter)
			.then(resolve)
			.catch(reject)
	})
}


function getOne(dbModel, sessionDoc, req) {
	return new Promise((resolve, reject) => {
		dbModel.contacts.findOne({ _id: req.params.param1 })
			.then(doc => {
				if (dbnull(doc, reject)) {
					resolve(doc)
				}
			})
			.catch(reject)
	})
}

function post(dbModel, sessionDoc, req) {
	return new Promise((resolve, reject) => {
		let data = req.body || {}
		data._id = undefined
		let newDoc = new dbModel.contacts(data)
		if (!epValidateSync(newDoc, reject))
			return
		newDoc.save().then(resolve).catch(reject)
	})
}

function put(dbModel, sessionDoc, req) {
	return new Promise((resolve, reject) => {
		if (req.params.param1 == undefined)
			return restError.param1(req, reject)
		let data = req.body || {}
		data._id = req.params.param1
		data.modifiedDate = new Date()

		dbModel.contacts.findOne({ _id: data._id })
			.then(doc => {
				if (dbnull(doc, reject)) {
					let doc2 = Object.assign(doc, data)
					let newDoc = new dbModel.contacts(doc2)

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
		dbModel.contacts.removeOne(sessionDoc, { _id: data._id }).then(resolve).catch(reject)
	})
}