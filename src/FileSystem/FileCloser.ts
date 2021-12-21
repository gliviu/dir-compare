import fs from 'fs'
import { FileDescriptorQueue } from './FileDescriptorQueue'

function closeFilesSync(fd1?: number, fd2?: number): void {
    if (fd1) {
        fs.closeSync(fd1)
    }
    if (fd2) {
        fs.closeSync(fd2)
    }
}

function closeFilesAsync(fd1: number | undefined, fd2: number | undefined, fdQueue: FileDescriptorQueue): Promise<void> {
    if (fd1 && fd2) {
        return fdQueue.closePromise(fd1).then(() => fdQueue.closePromise(fd2))
    }
    if (fd1) {
        return fdQueue.closePromise(fd1)
    }
    if (fd2) {
        return fdQueue.closePromise(fd2)
    }
    return Promise.resolve()
}


export const FileCloser = {
    closeFilesSync,
    closeFilesAsync
}
