var ingenico=require('./ingenico/ingenico.js')

var calisanDatabaseler={}

exports.start=()=>{
	runServiceOnAllUserDb({
		filter:{'services.posDevice':true},
		serviceFunc:(dbModel,cb)=>{ syncPosDeviceSync(dbModel,cb) },
		name:'posDevice',
		repeatInterval:120000
//		repeatInterval:config.repeatInterval || 60000
	})
	
}


function syncPosDeviceSync(dbModel,cb){
	
	try{
		checkDbAndDownload(dbModel,(err)=>{
			if(err){
				errorLog(`${dbModel.nameLog} Error: syncPosDeviceSync:`,err)
			}
			cb()
		})
	}catch(tryErr){
		errorLog(`tryErr:`,tryErr)
		cb()
	}
}


function checkDbAndDownload(dbModel,callback){

	if(dbModel.pos_device_services==undefined) 
		return callback(null)
	
	dbModel.pos_device_services.find({url:{$ne:''},passive:false},(err,serviceDocs)=>{
		if(dberr(err,callback)){
			var index=0
			function runService(cb){
				if(index>=serviceDocs.length){
					cb(null)
				}else{
					let filter={service:serviceDocs[index]._id,passive:false}
					
					dbModel.pos_devices.find(filter,(err,posDeviceDocs)=>{
						if(!err){
							eventLog(`${dbModel.nameLog} Srvc:${serviceDocs[index].name.cyan}, deviceCount: ${posDeviceDocs.length.toString().yellow}`)
							
							downloadData(dbModel,serviceDocs[index],posDeviceDocs,(err)=>{
								if(err){
									errorLog(`${dbModel.nameLog} Srvc:${serviceDocs[index].name.cyan} _id:${serviceDocs[index]._id.cyan}:`,err)
								}
								index++
								setTimeout(runService,8000,cb)
							})
						}else{
							index++
							setTimeout(runService,8000,cb)
							//cb(err)
						}
					})
				}
			}

			runService((err)=>{
				callback(err)
			})

		}
	})
}

function downloadData(dbModel,serviceDoc,posDeviceDocs,cb){
	
	switch(serviceDoc.type){
		case 'ingenico':
		ingenico.download(dbModel,serviceDoc,posDeviceDocs,cb)
		break
		default:
		cb(null)
		break
	}
}


exports.zreportDataToString=(serviceType,data)=>{
	switch(serviceType){
		case 'ingenico':
		return ingenico.zreportDataToString(data)
		default:
		return 'ZREPORT DETAIL...'
	}
}
