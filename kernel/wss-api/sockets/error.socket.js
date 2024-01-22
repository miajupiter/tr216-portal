module.exports = (socket,err) => {
	devLog('error.socket :', err)
	errorLog(`[Error] id:${socket.clientId}`,err)
	
}
