module.exports = (dbModel, sessionDoc, req) =>
	new Promise(async (resolve, reject) => {
		if (req.method === 'GET') {
      sessionDoc.populate({
        path:'member',
        select:'-password'})
      .then(resolve)
      .catch(reject)
		} else {
			restError.method(req, reject)
		}
	})
