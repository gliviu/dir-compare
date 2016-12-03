'use strict';

var fs = require('fs');

/**
 * Limits the number of concurrent file handlers.
 * Use it as a wrapper over fs.open() and fs.close().
 * Example:
 *  var fdQueue = new FileDescriptorQueue(8);
 *  fdQueue.open(path, flags, (err, fd) =>{
 *    ...
 *    fdQueue.close(fd, (err) =>{
 *      ...
 *    });
 *  });
 *  As of node v7, calling fd.close without a callback is deprecated.
 */
var FileDescriptorQueue = function(maxFilesNo) {
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
			activeCount++;
			fs.open(job.path, job.flags, function(err, fd) {
				job.callback(err, fd);
			});
		}
	}

	var close = function(fd, callback) {
		activeCount--;
		fs.close(fd, callback);
		process();
	}

	return {
		open : open,
		close : close
	};
}

module.exports = FileDescriptorQueue;
