let apiUrl = location.origin
if (location.origin.indexOf('localhost') > -1)
	apiUrl = 'http://localhost:3501'

var config = {
	basePath: '/portal',
	api: {
		url: apiUrl + '/api/v1'
	},
	websocketApi: {
		url: 'ws://localhost:3501'
	},
	ui: {
		title: 'AliAbi Portal 216',
		logo: `<div class="d-flex align-items-center"><img class="logo" src="img/logo.png" alt="logo" style="max-height:30px;"> <div class="fs-150 ms-2">Portal 216</div></div>`,
		copyRight: `&copy; ${(new Date()).getFullYear()} AliAbi Developer Team`
	}

}
