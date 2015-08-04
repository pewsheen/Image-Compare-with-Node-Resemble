/* Module */
var resemble 	= require('./resemble.js');
var fs 			= require('fs');
var walk 		= require('walk');
var path 		= require('path');
var mkdirp 		= require('mkdirp');

/* Options */
var testDir 		= 'imgTest';
var	sampleDir 		= 'imgSample';
var diffThreshold 	= 2;
var inputImageType 	= 'jpg';

function startCompare(){

	totalFileNumber = files.length;
	console.log('Total files: ' + totalFileNumber);

	for (var index in files) {

		var compareImgPath = files[index];
		var sampleImgPath = compareImgPath.replace(testDir, sampleDir);

		// Check sample file exist
		if(!fs.existsSync(sampleImgPath)) {
			var logMesg = '[IOERROR] File not exist: ' + sampleImgPath;
			logs(logMesg, 1, 0, 1, 1);
		} else {
			compare(compareImgPath, sampleImgPath, index+1);
		}
	}
};

function compare(compareImgPath, sampleImgPath, currentFileIndex) {

	var compareImg64 = base64_encode(compareImgPath);
	var sampleImg64  = base64_encode(sampleImgPath);
	var compareImg 	 = 'data:image/'+inputImageType+';base64,'+ base64_encode(compareImgPath);
	var sampleImg 	 = 'data:image/'+inputImageType+';base64,'+ base64_encode(sampleImgPath);

	// Check file broken?
	if(compareImg64 == ''){
		var logMesg = '[IOERROR] File broken: ' + compareImgPath;
		logs(logMesg, 1, 0, 1, 1);
	} else if (sampleImg64 == '') {
		var logMesg = '[IOERROR] File broken: ' + sampleImgPath;
		logs(logMesg, 1, 0, 1, 1);
	} else {
		resemble(compareImg).compareTo(sampleImg).onComplete(function(data){
		/*-----------------------
			Compare Complete
		-----------------------*/

			// Calculate complete percentage
			completePercentage = (currentFileIndex / totalFileNumber) * 100;

			// Print log
			var logMesg = '[' + completePercentage.toFixed(2) + '%] [Diff: '+ data.misMatchPercentage + '%] '
							+ compareImgPath.replace('./'+testDir, '');
			logs(logMesg, 1, 0, 0, 1);

			/*
				Difference Threshold
			*/
			if (data.misMatchPercentage > diffThreshold) {
				var resultImgPath = compareImgPath.replace('./'+testDir, timeStamp+'/diffImgs');
				resultImgPath = resultImgPath.replace('.'+inputImageType, '.png');

				// Create result dir if not exists.
				var resultDirPath = path.dirname(resultImgPath);
				if (!fs.existsSync(resultDirPath)){
					mkdirp.sync(resultDirPath);
				}
				// Save diff highlight result
				fs.writeFileSync(resultImgPath, new Buffer(data.getImageDataUrl().replace('data:image/png;base64,', ''), 'base64'));
				logs(logMesg, 0, 1, 0, 1);
			}
		})
	}
}

function getExtension(filename) {
	var i = filename.lastIndexOf('.');
	return (i < 0) ? '' : filename.substr(i);
}

function getTimestamp(){
	d = new Date();
	str = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+'_'+d.getHours()+'-'+d.getMinutes()+'-'+d.getSeconds();
	return str
}

function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

function logs(mesg, log, diff, err, printOnConsole) {

	var logPath = timeStamp + '/log.txt';
	var logDiff = timeStamp + '/log_diff.txt';
	var logErr = timeStamp + '/log_err.txt';

	if( log == 1 )
		fs.appendFileSync(logPath, mesg+'\n');
	if( diff == 1 )
		fs.appendFileSync(logDiff, mesg+'\n');
	if( err == 1 )
		fs.appendFileSync(logErr, mesg+'\n');
	if( printOnConsole == 1 )
		console.log(mesg);
}

/*-------------------
	Main
-------------------*/

var totalFileNumber  = 0;
var timeStamp = 0;
var files   = [];
var walker;

timeStamp = getTimestamp();
console.log('Time: '+ timeStamp);

/* Create result folder */
if (!fs.existsSync(timeStamp)){
	fs.mkdirSync(timeStamp);
}

/* Collect file list */
walker = walk.walk('./'+testDir, { 
	followLinks: false
});

walker.on('file', function(root, stat, next) {
	// Add this file to the list of files
	if(path.extname(stat.name) == '.'+inputImageType)
		files.push(root + '/' + stat.name);
	next();
});

walker.on('end', function() {
	startCompare();
});

// Catch and show error
process.on('uncaughtException', function(err) {
    console.log(err);
})