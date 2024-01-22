module.exports = (dbModel, sessionDoc, req) =>
	new Promise(async (resolve, reject) => {
		if (req.method === 'GET') {
			db.sessions.find({member:sessionDoc.member,closed:false})
			.populate({
        path:'member',
        select:'-password'})
      .then(resolve)
      .catch(reject)
		} else {
			restError.method(req, reject)
		}
	})
