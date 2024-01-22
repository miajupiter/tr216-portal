const { permissionType } = require('../../../db/helpers/db-types')
const auth = require('../../../lib/auth')
module.exports = (req) =>
	new Promise((resolve, reject) => {
		if (req.method == 'POST') {
			let username = req.getValue('username')
			let password = req.getValue('password')
			let deviceId = req.getValue('deviceId')
			if (username.trim() == '')
				return reject('Username required')

			if (password == '')
				return reject('Password required')

			if (!username.includes('@') && !username.startsWith('+'))
				username = `+${username}`

			login(username, password)
				.then((userDoc) => {
					saveSession(userDoc, req).then(resolve).catch(reject)
				})
				.catch(reject)
		} else {
			restError.method(req, reject)
		}
	})

function login(username, password) {
	return new Promise((resolve, reject) => {
		db.members
			.findOne({ username: username, password: password })
			.then((doc) => {
				if (doc == null) {
					reject(`Login failed`)
				} else if (doc.passive) {
					reject(`User is not active`)
				} else {
					resolve(doc)
				}
			})
			.catch(reject)
	})
}

async function saveSession(userDoc, req) {
	let deviceId = req.getValue('deviceId')
	let oldSessions = []
	try {
		oldSessions = await db.sessions
			.find({ member: userDoc._id })
			.sort({ _id: -1 })
			.limit(1)

		db.sessions.updateMany(
			{ member: userDoc._id, deviceId: deviceId, closed: false },
			{ $set: { closed: true } },
			{ multi: true }
		)
	} catch {}

	return new Promise(async (resolve, reject) => {
		let oldDbId = null
		let sessionDoc = new db.sessions({
			member: userDoc._id,
			role: userDoc.role,
			deviceId: deviceId,
			IP: req.IP || '',
			lastIP: req.IP || '',
			closed: false,
			language: 'tr',
			requestHeaders: req.headers,
			permissions: util.clone(permissionType),
		})
		if (oldSessions.length > 0) {
			sessionDoc.language = oldSessions[0].language
			oldDbId = oldSessions[0].dbId
		}
		let filter = {
			deleted: false,
			passive: false,
			$or: [
				{ owner: userDoc._id },
				{ 'authorizedMembers.memberId': userDoc._id },
			],
		}
		try {
			let dbDocs = await db.dbDefines
				.find({ _id: oldDbId, ...filter })
				.sort({ _id: -1 })
				.limit(1)

			if (dbDocs.length == 0)
				dbDocs = await db.dbDefines.find(filter).sort({ _id: -1 }).limit(1)

			if (dbDocs.length > 0) {
				sessionDoc.dbId = dbDocs[0]._id
				if (dbDocs[0].owner == userDoc._id)
					sessionDoc.permissions.isAdmin = true
			}
		} catch {}

		sessionDoc
			.save()
			.then((newDoc) => {
				let obj = {
					sessionId: newDoc._id.toString(),
				}
				console.log(`obj:`,obj)
				resolve(auth.sign(obj))
			})
			.catch(reject)
	})
}


// let filter = {
//   deleted: false,
//   passive: false,
//   permissions:{
//     isAdmin:false,
//     canRead:true,
//     canWrite:true,
//     canDelete:false
//   }
// }
// let otto={ id:15,...filter }
// console.log(otto)
