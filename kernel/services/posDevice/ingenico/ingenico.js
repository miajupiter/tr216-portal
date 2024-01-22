var api=require('./api.js')

const zRaporInterval=10000
const zRaporTimeoutWait=60000
exports.download=(dbModel,serviceDoc,posDeviceDocs,callback)=>{
	if(posDeviceDocs.length>0){
		let index=0

		function zRaporIndir(cb){
			if(index>=posDeviceDocs.length)
				return cb(null)

			let deviceSerialNo=(posDeviceDocs[index] || {}).deviceSerialNo || ''
			if(deviceSerialNo!=''){

				eventLog(`${dbModel.nameLog} ${serviceDoc.name.cyan}, ${'zRaporIndir()'.yellow} ${deviceSerialNo.green} ${(index+1).toString().green}/${posDeviceDocs.length.toString().yellow}`)
				generateReqOption(dbModel,posDeviceDocs[index],(err,reqOpt)=>{
					if(!err){
						api.getZReport(serviceDoc,reqOpt,(err,resp)=>{
							if(!err){
								insertZReports(dbModel,posDeviceDocs[index],resp.ZReportItems,(err)=>{
									if(err){
										errorLog(`${dbModel.nameLog} ${serviceDoc.name.cyan}, api.getZReport ERROR: ${deviceSerialNo.yellow}`,err.message)
									}
									index++
									setTimeout(zRaporIndir,zRaporInterval,cb)
								})
							}else{
								if(config.status=='development')
									fs.appendFileSync(`c:/arge/temp/${dbModel.dbName.trim().replaceAll(' ','_')}_hatali_cihazlar.txt` , deviceSerialNo + '\r\n')
								if(err.code!=undefined){
									if(err.code=='ETIMEDOUT'){

										eventLog(`${dbModel.nameLog} ${serviceDoc.name.cyan}, ${err.code} ${deviceSerialNo.yellow} ${zRaporTimeoutWait/1000}sn sonra yeniden.`)
										
										setTimeout(zRaporIndir,zRaporTimeoutWait,cb)
									}else if( err.code=='ERR_427'){
										index++
										errorLog(`${dbModel.nameLog} ${serviceDoc.name.cyan}, api.getZReport ERROR: ${deviceSerialNo.yellow}`,err.code || err.name || '',err.message)
										setTimeout(zRaporIndir,zRaporInterval,cb)
									}else if( err.code=='ERR_403'){
										index++
										errorLog(`${dbModel.nameLog} ${serviceDoc.name.cyan}, api.getZReport ERROR: ${deviceSerialNo.yellow}`,err.code || err.name || '')
										setTimeout(zRaporIndir,zRaporInterval,cb)
									}else{
										index++
										errorLog(`${dbModel.nameLog} ${serviceDoc.name.cyan}, api.getZReport ERROR: ${deviceSerialNo.yellow}`,err.code || err.name || '',err.message)
										setTimeout(zRaporIndir,zRaporInterval,cb)
									}
								}else{
									index++
									errorLog(`${dbModel.nameLog} ${serviceDoc.name.cyan}, api.getZReport ERROR: ${deviceSerialNo.yellow}`,err.code || err.name || '',err.message)
									setTimeout(zRaporIndir,zRaporInterval,cb)
								}

							}
						})
					}else{
						index++
						errorLog(`${dbModel.nameLog} ${serviceDoc.name.cyan}, generateReqOption() ERROR: ${deviceSerialNo.yellow}`,err.code || err.name || '',err.message)
						setTimeout(zRaporIndir,zRaporInterval,cb)
					}
				})
			}else{
				index++
				setTimeout(zRaporIndir,zRaporInterval,cb)
			}
		}

		zRaporIndir((err)=>{
			if(err){
				errorLog(`${dbModel.nameLog} Srvc:${serviceDoc.name.cyan}, download ERROR:`,err.code || err.name || '')
			}
			callback(err)
		})
	}else{
		callback(null)
	}
}

function insertZReports(dbModel,posDeviceDoc,ZReportItems,callback){
	if(ZReportItems.length==0) return callback(null)

		var index=0
	function dahaOncedenKaydedilmisMi(cb){
		if(index>=ZReportItems.length){
			return cb(null)
		}
		dbModel.pos_device_zreports.countDocuments({posDevice:posDeviceDoc._id,zNo:ZReportItems[index].ZNo},(err,c)=>{
			if(!err){
				
				if(c==0){
					index++
					setTimeout(dahaOncedenKaydedilmisMi,0,cb)
				}else{
					ZReportItems.splice(index,1)
					setTimeout(dahaOncedenKaydedilmisMi,0,cb)
				}
			}else{
				errorLog(`${dbModel.nameLog} insertZReports deviceSerialNo: ${posDeviceDoc.deviceSerialNo.yellow} ERROR:`,err)
				cb(err)
			}
		})
	}
	
	dahaOncedenKaydedilmisMi((err)=>{
		if(!err){
			if(ZReportItems.length==0) return callback(null)
				var data=[]
			ZReportItems.forEach((e)=>{
				var d=(new Date(e.ZDate))
				d.setMinutes(d.getMinutes()+(new Date()).getTimezoneOffset()*-1)

				data.push({posDevice:posDeviceDoc._id,data:e,zNo:e.ZNo,zDate:d,zTotal:e.GunlukToplamTutar})

			})
			data.sort(function(a,b){
				if(a.zDate>b.zDate) 
					return 1
				if(a.zDate<b.zDate) 
					return -1
				return 0
			})

			dbModel.pos_device_zreports.insertMany(data,{ordered:true},(err,docs)=>{
				if(err){
					errorLog(`${dbModel.nameLog} dahaOncedenKaydedilmisMi deviceSerialNo: ${posDeviceDoc.deviceSerialNo.yellow} ERROR:`,err)
				}
				callback(err)
			})
		}else{
			errorLog(`${dbModel.nameLog} dahaOncedenKaydedilmisMi deviceSerialNo: ${posDeviceDoc.deviceSerialNo.yellow} ERROR:`,err)
			callback(err)
		}
	})
}


function generateReqOption(dbModel,posDeviceDoc,cb){
	if((posDeviceDoc.deviceSerialNo || '')==''){
		return cb({code:'WRONG_VALUE',message:'Pos Cihaz serino hatalı'})
	}
	dbModel.pos_device_zreports.find({posDevice:posDeviceDoc._id}).sort({zDate:-1}).limit(1).exec((err,docs)=>{
		if(!err){
			var reqOptions={
				"ReportId": 0, 
				"SerialList": [ posDeviceDoc.deviceSerialNo ], 
				"StartDate": defaultStartDate(), 
				"EndDate": endDate(), 
				"ExternalField": "", 
				"ReceiptNo": 0, 
				"ZNo": 0, 
				"GetSummary":false, 
				"SaleFlags": 0 
			}
			//qwerty tekrar kullanilacak
			// if(docs.length>0){
			// 	var maxZDate=docs[0]['zDate']
			// 	reqOptions.StartDate=maxZDate.toISOString()
			// }
			
			cb(null,reqOptions)
		}else{
			cb(err)
		}
	})
}

function defaultStartDate(){
	return (new Date((new Date()).getFullYear(),9,1,0,(new Date()).getTimezoneOffset()*-1,0)).toISOString()
	
	// qwerty
	// return (new Date((new Date()).getFullYear(),0,1,0,(new Date()).getTimezoneOffset()*-1,0)).toISOString()
}



function endDate(){
	var a=new Date()
	a.setMinutes(a.getMinutes()+(new Date()).getTimezoneOffset()*-1)
	return a.toISOString()
}


exports.zreportDataToString=(data)=>{
	return 'ZNo:' + data.ZNo + ', Tarih:' + data.ZDate.substr(0,10) + ' ' + data.ZTime + ', Toplam:' + data.GunlukToplamTutar.formatMoney(2,',','.') + ', T.Kdv:' + data.GunlukToplamKDV.formatMoney(2,',','.')
}