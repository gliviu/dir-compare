import fs from 'fs'
import { BytesRead } from './types/BytesRead'

export = {
    async readdir(path: string): Promise<string[]> {
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
    async read(fd: number, buffer: Buffer, offset: number, length: number, position: number | null): Promise<BytesRead> {
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
