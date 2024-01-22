const collectionName = path.basename(__filename, '.collection.js')
module.exports = function (dbModel) {
  let schema = mongoose.Schema(
    {
      username: { type: String, required: true, unique: true },
      password: { type: String, default: '', index: true },
      credentialType: {
        type: String,
        default: '',
        enum: [
          '',
          'email',
          'sms',
          'email-link',
          'sms-code',
          'google-oauth2',
          'facebook',
          'github',
          'appleid',
          'discord',
        ],
        index: true,
      },
      role: { type: String, default: 'user' },
      passive: { type: Boolean, default: false, index: true },
      createdDate: { type: Date, default: Date.now },
      modifiedDate: { type: Date, default: Date.now },
    },
    { versionKey: false }
  )

  schema.pre('save', (next) => next())
  schema.pre('remove', (next) => next())
  schema.pre('remove', true, (next, done) => next())
  schema.on('init', (model) => {})
  schema.plugin(mongoosePaginate)

  let model = dbModel.conn.model(collectionName, schema, collectionName)

  model.removeOne = (member, filter) =>
    sendToTrash(dbModel, collectionName, member, filter)
  return model
}
