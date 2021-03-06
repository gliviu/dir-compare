import fs, { NoParamCallback } from 'fs'
import Queue from './Queue'

type OpenFileFlags = string | undefined
type OpenFileCallback = (err: NodeJS.ErrnoException | null, fd: number) => void

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
export class FileDescriptorQueue {
	private activeCount = 0
	private pendingJobs = new Queue()
	constructor(private maxFilesNo: number) { }

	open(path: string, flags: OpenFileFlags, callback: OpenFileCallback): void {
		this.pendingJobs.enqueue({
			path: path,
			flags: flags,
			callback: callback
		})
		this.process()
	}

	process(): void {
		if (this.pendingJobs.getLength() > 0 && this.activeCount < this.maxFilesNo) {
			const job = this.pendingJobs.dequeue()
			this.activeCount++
			fs.open(job.path, job.flags, job.callback)
		}
	}

	close(fd: number, callback: NoParamCallback): void {
		this.activeCount--
		fs.close(fd, callback)
		this.process()
	}

	openPromise(path: string, flags: OpenFileFlags): Promise<number> {
		return new Promise<number>((resolve, reject) => {
			this.open(path, flags, (err, fd) => {
				if (err) {
					reject(err)
				} else {
					resolve(fd)
				}
			})
		})
	}

	closePromise(fd: number): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.close(fd, (err) => {
				if (err) {
					reject(err)
				} else {
					resolve()
				}
			})
		})
	}
}
