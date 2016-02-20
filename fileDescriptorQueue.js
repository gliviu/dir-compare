'use strict';

var fs = require('fs');
var Promise = require('bluebird');
var util = require('util');

/**
 * Limits the number of concurrent file handlers.
 * Use it as a wrapper over fs.open() and fs.close().
 */
var FileQueue = function(maxFilesNo) {
	var activeJobs = {};
	var pendingJobs = [];
	var activeCount = 0;

	var open = function(path, flags, callback) {
		
		pendingJobs.push({
			path : path,
			flags : flags,
			callback : callback
		});
		process();
	}

	var process = function() {
		if (pendingJobs.length > 0 && activeCount < maxFilesNo) {
			var job = pendingJobs.shift();
			activeJobs[job.fd] = job;
			activeCount++;
			fs.open(job.path, job.flags, function(err, fd) {
				job.callback(err, fd);
			});
		}
	}

	var close = function(fd, callback) {
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