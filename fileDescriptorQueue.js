'use strict';

var fs = require('fs');
var Promise = require('bluebird');
var util = require('util');

var log = function(str){
//	console.log(str);
}
/**
 * maxFilesNo - number of files that can be open concurrently.
 */
var FileQueue = function(maxFilesNo) {
	var activeJobs = {};
	var pendingJobs = [];
	var activeCount = 0;

	var open = function(path, flags, callback) {
		
//		log(util.format('a1: %s', i));
		pendingJobs.push({
			path : path,
			flags : flags,
			callback : callback
		});
		process();
	}

	var process = function() {
//		log(util.format('b1: %s', i));
//		log(util.format('b1_pending jobs:%d %s', pendingJobs.length, i));
		if (pendingJobs.length > 0 && activeCount < maxFilesNo) {
//			log(util.format('b2: %s', i));
			var job = pendingJobs.shift();
			activeJobs[job.fd] = job;
			activeCount++;
			fs.open(job.path, job.flags, function(err, fd) {
				job.callback(err, fd);
			});
		}
	}

	var close = function(fd, callback) {
//		log(util.format('c1: %s', i));
		delete activeJobs.fd;
		activeCount--;
		fs.close(fd, callback);
		process();
	}

	return {
		open : open,
		close : close
	};
}

module.exports = FileQueue;