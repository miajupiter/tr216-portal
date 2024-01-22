const sender = require('../../../lib/sender')

module.exports = (req) =>
	new Promise((resolve, reject) => {
		if (req.method == 'POST') {
			let username =req.getValue('username')
			let password =req.getValue('password')
			let deviceId =req.getValue('deviceId')

			if (username.trim() == '')
				return reject('Username required')
			if (!username.includes('@') && !username.startsWith('+'))
				username = `+${username}`

			if (password == '')
				return reject('Password required')

			db.members
				.findOne({ username: username })
				.then((memberDoc) => {
					if (!memberDoc) {
						db.authCodes
							.updateMany(
								{ username: username, verified: false, passive: false },
								{ $set: { passive: true } },
								{ multi: true }
							)
							.then(() => {
								let newAuthDoc = new db.authCodes({
									username: username,
									password: password,
									authCode: '893050', //qwerty util.randomNumber(120000, 998000).toString(),
									authCodeExpire: new Date(
										new Date().setSeconds(
											new Date().getSeconds() +
												Number(process.env.AUTHCODE_EXPIRE || 180)
										)
									),
									deviceId: deviceId,
									// verified: false, 
									verified: true, // qwerty : default: false
									passive: false,
								})
								newAuthDoc
									.save()
									.then((newAuthDoc2) => {
										if (util.isValidTelephone(newAuthDoc2.username)) {
											sender
												.sendAuthSms(newAuthDoc2.username, newAuthDoc2.authCode)
												.then(resolve)
												.catch(reject)
										} else if (util.isValidEmail(newAuthDoc2.username)) {
											sender
												.sendAuthSms(newAuthDoc2.username, newAuthDoc2.authCode)
												.then(resolve)
												.catch(reject)
										} else {
											console.log(
												'AuthCode:\n',
												newAuthDoc2.username,
												newAuthDoc2.authCode
											)
											resolve()
										}
									})
									.catch(reject)
							})
							.catch(reject)
					} else {
						reject('User already exists')
					}
				})
				.catch(reject)
		} else {
			restError.method(req, reject)
		}
	})
