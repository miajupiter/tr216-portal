const { permissionSchemaType } = require('../../helpers/db-types')
const collectionName = path.basename(__filename, '.collection.js')

module.exports = function (dbModel) {

	let schema = mongoose.Schema(
		{
			owner: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'members',
				default: null,
				index: true,
			},
			authorizedMembers: [
				{
					memberId: {
						type: mongoose.Schema.Types.ObjectId,
						ref: 'members',
						default: null,
						index: true,
					},
					permissions: permissionSchemaType,
				},
			],
			displayName: { type: String, default: '', index: true },
			dbName: { type: String, default: '', index: true },
			dbServer: { type: String, default: '', index: true },
			stats: {},
			version: { type: String, default: '', index: true },
			deleted: { type: Boolean, default: false, index: true },
			passive: { type: Boolean, default: false, index: true },
			createdDate: { type: Date, default: Date.now },
			modifiedDate: { type: Date, default: Date.now },
		},
		{ versionKey: false }
	)

	schema.pre('save', (next) => next())
	schema.pre('remove', (next) => next())
	schema.pre('remove', true, (next, done) => next())
	schema.on('init', (model) => { })
	schema.plugin(mongoosePaginate)

	let model = dbModel.conn.model(collectionName, schema, collectionName)

	model.removeOne = (session, filter) =>
		sendToTrash(dbModel, collectionName, session, filter)
	return model
}
