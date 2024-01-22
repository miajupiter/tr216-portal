var urllib = require('urllib')

function ingenicoWebService(serviceUrl, username, password, endPoint, reqOptions, cb) {
	let restHelper = require(path.join(__root, 'lib/rest-helper.js'))(serviceUrl)

	let url = serviceUrl + endPoint
	let headers = {
		'content-type': 'application/json',
		'Operator': 'tr216',
		'Authorization': 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
	}

	var options = {
		method: 'POST',
		headers: headers,
		rejectUnauthorized: false,
		dataType: 'json',
		data: reqOptions,
		timeout: 50000
	}


	urllib.request(url, options, (error, body, response, soapHeader, rawRequest) => {

		if(!error) {
			if(typeof body == 'string') {

				try {
					var resp = JSON.parse(body)

				} catch (e) {
					if(response) {
						if(response.headers) {
							if(response.headers['content-type'] == 'text/html') {
								if(cb) {
									return cb({ code: 'ERR_' + response.statusCode, message: response.data || e.message })
								}
							}
						}
					}
					if(cb)
						cb(e)
				}
			} else {
				try {
					if(body.ErrCode != '0' && body.ErrCode != '') {
						if(cb)
							cb({ code: body.ErrCode, message: body.ErrDesc })
					} else {
						if(cb)
							cb(null, body)
					}
				} catch (e) {
					if(cb)
						cb(e)
				}
			}

		} else {
			if(response) {
				if(response.headers) {
					if(response.headers['content-type'] == 'text/html') {
						if(cb) {
							return cb({ code: 'ERR_' + response.statusCode, message: response.data || e.message })
						}
					}
				}
			}
			if(cb)
				cb(error)
		}
	})
}

exports.getZReport = (serviceOptions, reqOptions, cb) => {

	ingenicoWebService(serviceOptions.url, serviceOptions.username, serviceOptions.password, '/GetZReport', reqOptions, (err, resp) => {
		if(!err) {
			cb(err, resp)
		} else {
			cb(err, resp)
		}

	})
}

exports.getZReportSubParts = (serviceOptions, reqOptions, zNo, ekuNo, cb) => {

	reqOptions['ExternalField'] = zNo + ';' + ekuNo
	ingenicoWebService(serviceOptions.url, serviceOptions.username, serviceOptions.password, '/GetZReportSubParts', reqOptions, (err, resultSubParts) => {
		cb(err, resultSubParts)
	});
}