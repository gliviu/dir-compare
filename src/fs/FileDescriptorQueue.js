const fs = require('fs')
const Queue = require('./Queue')
/**
 * Limits the number of concurrent file handlers.
 * Use it as a wrapper over fs.open() and fs.close().
 * Example:
 *  const fdQueue = new FileDescriptorQueue(8)
 *  fdQueue.open(path, flags, (err, fd) =>{
 *    ...
 *    fdQueue.close(fd, (err) =>{
 *      ...
 *    })
 *  })
 *  As of node v7, calling fd.close without a callback is deprecated.
 */
function FileDescriptorQueue(maxFilesNo) {
	const pendingJobs = new Queue()
	let activeCount = 0

	const open = (path, flags, callback) => {
		pendingJobs.enqueue({
			path: path,
			flags: flags,
			callback: callback
		})
		process()
	}

	const process = () => {
		if (pendingJobs.getLength() > 0 && activeCount < maxFilesNo) {
			const job = pendingJobs.dequeue()
			activeCount++
			fs.open(job.path, job.flags, job.callback)
		}
	}

	const close = (fd, callback) => {
		activeCount--
		fs.close(fd, callback)
		process()
	}

	const promises = {
		open: (path, flags) => new Promise((resolve, reject) => {
			open(path, flags, (err, fd) => {
				if (err) {
					reject(err)
				} else {
					resolve(fd)
				}
			})
		}),

		close: (fd) => new Promise((resolve, reject) => {
			close(fd, (err) => {
				if (err) {
					reject(err)
				} else {
					resolve()
				}
			})
		})
	}

	return {
		open: open,
		close: close,
		promises: promises
	}
}

module.exports = FileDescriptorQueue
