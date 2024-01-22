const collectionName = path.basename(__filename, '.collection.js')
module.exports = function (dbModel) {
	let schema = mongoose.Schema(
		{
			isGroup: { type: Boolean, default: false },
			ts: { type: Number, default: new Date().getTime(), index: true },
			dateGroup: {
				type: String,
				default: () => new Date().toISOString().substring(0, 10),
				index: true,
			},
			contactId: { type: String, required: true, index: true },
			senderId: { type: String, default: '', index: true },
			contentType: {
				type: String,
				enum: [
					'message',
					'photo',
					'file',
					'contact',
					'invoice',
					'order',
					'payment',
				],
				index: true,
			},
			content: { type: String, required: true },
			contentDetail: {},
			reactions: {
				// senderId: { type: String,  default:'', index:true},
				// time: { type: Date,default: Date.now, index:true},
				// reaction: {type:String, default:'', enum:['','like','accept','decline']}
			},
			status: {
				type: String,
				default: '',
				enum: ['', 'sent', 'delivered', 'seen'],
			},
			deleted: { type: Boolean, default: false, index: true },
			deletedDate: { type: Date, default: Date.now },
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
