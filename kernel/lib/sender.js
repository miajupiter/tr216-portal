exports.sendAuthSms = (tel, authCode) =>
	new Promise((resolve, reject) => {
		devLog('sendAuthSms:', tel, authCode)
		resolve()
	})

exports.sendAuthEmail = (email, authCode) =>
	new Promise((resolve, reject) => {
		devLog('sendAuthEmail:', email, authCode)
		resolve()
	})

exports.sendForgotPasswordSms = (tel, password) =>
	new Promise((resolve, reject) => {
		devLog('sendForgotPasswordSms:', tel, password)
		resolve()
	})

exports.sendForgotPasswordEmail = (email, password) =>
	new Promise((resolve, reject) => {
		devLog('sendForgotPasswordEmail:', email, password)
		resolve()
	})
