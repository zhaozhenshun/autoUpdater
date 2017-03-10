var fs = require("fs");

// 创建一个可以写入的流，写入到文件 

exports.saveInfo = function(data,path,callback){

	var writerStream = fs.createWriteStream(path);

	// 使用 utf8 编码写入数据

	writerStream.write(data,'utf8');

	// 标记文件末尾
	writerStream.end();

	// 处理流事件 --> data, end, and error
	writerStream.on('finish', function() {
	    callback(null,true)
	});

	writerStream.on('error', function(err){
	   console.log(err.stack);
	   callback(err,false)
	});

	

	console.log("写入完成——————");


}
exports.readInfo = function(path,callback){
	var data ='';
	var readStream = fs.createReadStream(path);

	readStream.setEncoding('utf8');

	readStream.on('data', function(chunk) {
	   data += chunk;
	});

	readStream.on('end',function(){
		callback(null,data)
	});

	readStream.on('error', function(err){
	   console.log(err.stack);
	   callback(err,data)
	});

}