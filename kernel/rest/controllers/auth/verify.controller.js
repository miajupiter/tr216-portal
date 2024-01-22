const userDbHelper = require('../../../db/helpers/userdb-helper')

module.exports = (req) =>
	new Promise((resolve, reject) => {
		let username = req.getValue('username')
		let authCode = req.getValue('authCode')
		let deviceId = req.getValue('deviceId')

		authCode = authCode
			.replaceAll(' ', '')
			.replaceAll('-', '')
			.replaceAll('.', '')

		if (username.trim() == '')
			return reject('Username required')

		if (authCode.trim() == '')
			return reject('AuthCode required')

		if (!username.includes('@') && !username.startsWith('+'))
			username = `+${username}`

		db.authCodes
			.find({
				username: username,
				authCode: authCode,
				passive: false,
			})
			.sort({ _id: -1 })
			.limit(1)
			.then((docs) => {
				if (docs.length > 0) {
					if (docs[0].authCodeExpire.getTime() < new Date().getTime())
						return reject('AuthCode expired')
					if (docs[0].verified)
						return reject('AuthCode has already been verified')
					docs[0].verified = true
					docs[0].verifiedDate = new Date()
					docs[0]
						.save()
						.then((doc2) => {
							db.members
								.findOne({ username: doc2.username })
								.then((memberDoc) => {
									if (!memberDoc) {
										memberDoc = new db.members({
											username: doc2.username,
											password: doc2.password,
											passive: false,
											role: 'user',
										})
									}
									memberDoc
										.save()
										.then((memberDoc2) => {
											userDbHelper
												.newUserDb(memberDoc2, true, 'default')
												.then(() => resolve('Verification was successful'))
												.catch(reject)
										})
										.catch(reject)
								})
								.catch(reject)
						})
						.catch(reject)
				} else {
					reject('Verification failed')
				}
			})
			.catch(reject)
	})
