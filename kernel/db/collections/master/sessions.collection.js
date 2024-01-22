const { permissionSchemaType } = require('../../helpers/db-types')
const collectionName = path.basename(__filename, '.collection.js')
module.exports = function (dbModel) {
  let schema = mongoose.Schema(
    {
      member: { type: ObjectId, ref: 'members', default: null, index: true },
      dbId: { type: ObjectId, ref: 'dbDefines', default: null },
      permissions: permissionSchemaType,
      language: { type: String, default: 'tr' },
      deviceId: { type: String, default: '', index: true },
      IP: { type: String, default: '' },
      closed: { type: Boolean, default: false, index: true },
      createdDate: { type: Date, default: Date.now },
      lastOnline: { type: Date, default: Date.now, index: true },
      lastIP: { type: String, default: '' },
      socketId: { type: String, default: '' },
      requestHeaders: {},
    },
    { versionKey: false }
  )

  schema.pre('save', (next) => next())
  schema.pre('remove', (next) => next())
  schema.pre('remove', true, (next, done) => next())
  schema.on('init', (model) => {})
  schema.plugin(mongoosePaginate)

  let model = dbModel.conn.model(collectionName, schema, collectionName)

  model.removeOne = (session, filter) =>
    sendToTrash(dbModel, collectionName, session, filter)
  return model
}
