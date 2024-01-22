; (async () => {

  require('use-strict')
	require('colors')
	require('dotenv').config()
	global.path = require('path')
	global.fs = require('fs')
	global.__root = __dirname
	global.util = require('./kernel/lib/util')
	showAppInfo()

	await require('./kernel/db')()
	var app = await require('./kernel/kernel')()
	var httpServer = await require('./kernel/lib/http-server')(
		process.env.HTTP_PORT,
		app
	)

	await require('./kernel/wss-api/wss-api')(httpServer)


	setTimeout(() => {
		eventLog(`Application was started properly :-)`.yellow)
		process.env.NODE_ENV == 'development' && console.log(`\nhttp://localhost:${process.env.HTTP_PORT}/api/v1\n`)

		process.env.NODE_ENV == 'development' && console.log(`\nhttp://localhost:${process.env.HTTP_PORT}/portal\n`)

	}, 1000)


	process.env.NODE_ENV != 'development' &&
		process.on('uncaughtException', (err) => {
			errorLog('Caught exception: ', err)
		})
	process.env.NODE_ENV != 'development' &&
		process.on('unhandledRejection', (err) => {
			errorLog('Caught rejection: ', err)
		})
})()

function showAppInfo() {
	console.log('-'.repeat(70))
	console.log(
		'Application Name:'.padding(25),
		'TR216 Kernel'.toUpperCase().brightYellow
	)
	console.log('Http Port:'.padding(25), (process.env.HTTP_PORT || '').cyan)
	console.log('Uptime Started:'.padding(25), new Date().yyyymmddhhmmss().white)
	console.log(
		'Copyright:'.padding(25),
		`2014-${new Date().getFullYear()} (c) MrTEK Yazilim Evi`.green
	)
	console.log(
		'NODE_ENV:'.padding(25),
		(process.env.NODE_ENV || 'production').toUpperCase().cyan
	)

	console.log('-'.repeat(70))
}
