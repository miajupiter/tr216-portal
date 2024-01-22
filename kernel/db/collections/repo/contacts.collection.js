const collectionName = path.basename(__filename, '.collection.js')
module.exports = function (dbModel) {
	let schema = mongoose.Schema(
		{
			contactId: { type: String, required: true, unique: true }, // phoneNumber || email || @groupId || @moneyCase || @bank || @warehouse
			member: {
				type: mongoose.Schema.Types.ObjectId,
				default: null,
				index: true,
			},
			displayName: { type: String, default: '', index: true },
			isGroup: { type: Boolean, default: false, index: true },
			pinned: { type: Boolean, default: false, index: true },
			archived: { type: Boolean, default: false, index: true },
			hidden: { type: Boolean, default: false, index: true },
			mute: { type: Boolean, default: false },
			unread: { type: Number, default: 0, index: true },
			ts: { type: Number, default: 0, index: true },
			createdDate: { type: Date, default: Date.now, index: true },
			modifiedDate: { type: Date, default: Date.now, index: true },
			profilePicture: { type: String, default: '' },
		},
		{ versionKey: false }
	)

	schema.pre('save', (next) => next())
	schema.pre('remove', (next) => next())
	schema.pre('remove', true, (next, done) => next())
	schema.on('init', (model) => {})
	schema.plugin(mongoosePaginate)
	schema.plugin(mongooseAggregatePaginate)

	let model = dbModel.conn.model(collectionName, schema, collectionName)

	model.removeOne = (session, filter) =>
		sendToTrash(dbModel, collectionName, session, filter)

	return model
}
