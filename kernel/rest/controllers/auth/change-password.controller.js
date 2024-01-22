module.exports = (req) =>
  new Promise((resolve, reject) => {
    if (req.method === 'POST') {
      let username = req.getValue('username') || ''
      let oldPassword = req.getValue('oldPassword') || ''
      let newPassword = req.getValue('newPassword') || ''
      if (username.trim() == '') return reject('Username required')
      if (!username.includes('@') && !username.startsWith('+'))
        username = `+${username}`

      if (oldPassword == '') return reject('Old Password required')
      if (newPassword == '') return reject('New Password required')
      db.members
        .findOne({ username: username, password: oldPassword })
        .then((memberDoc) => {
          if (memberDoc) {
            memberDoc.password = newPassword
            memberDoc
              .save()
              .then(() =>
                resolve('Your password has been successfully changed.')
              )
              .catch(reject)
          } else {
            reject('Old Password failed')
          }
        })
        .catch(reject)
    } else restError.method(req, reject)
  })
