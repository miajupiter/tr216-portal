const sender = require('../../../lib/sender')
module.exports = (req) =>
  new Promise((resolve, reject) => {
    if (req.method === 'POST') {
      let username =req.params.param1 || req.getValue('username')

      if (username.trim() == '') return reject('Username required')

      db.members
        .findOne({ username: username })
        .then((memberDoc) => {
          if (memberDoc) {
            if (util.isValidTelephone(memberDoc.username)) {
              sender
                .sendForgotPasswordSms(memberDoc.username, memberDoc.password)
                .then(resolve)
                .catch(reject)
            } else if (util.isValidEmail(memberDoc.username)) {
              sender
                .sendForgotPasswordEmail(memberDoc.username, memberDoc.password)
                .then(resolve)
                .catch(reject)
            } else {
              resolve()
            }
          } else {
            reject('User not found')
          }
        })
        .catch(reject)
    } else restError.method(req, reject)
  })
