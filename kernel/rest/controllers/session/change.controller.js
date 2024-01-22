module.exports = (dbModel, sessionDoc, req) =>
  new Promise(async (resolve, reject) => {
    if (req.method === 'POST') {
      switch (req.params.param1) {
        case 'language':
          changeLanguage(dbModel, sessionDoc, req).then(resolve).catch(reject)
          break

        case 'db':
        case 'database':
          changeActiveDb(dbModel, sessionDoc, req).then(resolve).catch(reject)
          break

        default:
          restError.param1(req, reject)
          break
      }
    } else {
      restError.method(req, reject)
    }
  })

const changeLanguage = (dbModel, sessionDoc, req) =>
  new Promise((resolve, reject) => {
    if (req.params.param2) {
      sessionDoc.language = req.params.param2
      sessionDoc
        .save()
        .then(resolve('Session language has been successfully changed'))
        .catch(reject)
    } else restError.param2(req, reject)
  })

const changeActiveDb = (dbModel, sessionDoc, req) =>
  new Promise(async (resolve, reject) => {
    if (req.params.param2) {
        db.dbDefines.findOne({
          _id: req.params.param2,
          deleted: false,
          $or: [
            { owner: sessionDoc.member },
            { 'authorizedMembers.memberId': sessionDoc.member },
          ],
        }).then(dbDoc=>{
          
					if(dbNull(dbDoc,reject)) {
						sessionDoc.dbId=dbDoc._id
            sessionDoc
            .save()
            .then(resolve('Session database has been successfully changed'))
            .catch(reject)			
					}
				}).catch(reject)
      
    } else restError.param2(req, reject)
  })
