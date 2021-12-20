import fs from 'fs'

type BytesRead = number

export const FsPromise = {
    readdir(path: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(path, (err, files) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(files)
                }
            })
        })
    },
    read(fd: number, buffer: Buffer, offset: number, length: number, position: number | null): Promise<BytesRead> {
        return new Promise((resolve, reject) => {
            fs.read(fd, buffer, offset, length, position, (err, bytesRead) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(bytesRead)
                }
            })
        })
    },
}
