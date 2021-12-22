import { compareSync, compare } from "../../src"
import os = require('os')
import { CompareFn } from "./CompareFn"

const path1 = `/${os.tmpdir()}/linux-4.3`
const path2 = `/${os.tmpdir()}/linux-4.4`
const durationSeconds = 30
const MB = 1024 * 1024
const MAX_HEAP_MB = 300

async function testHeap(testType: 'sync' | 'async', compareFn: CompareFn): Promise<void> {
    console.log(`Start ${testType} heap test`)
    const startTime = Date.now()
    while (durationSeconds > (Date.now() - startTime) / 1000) {
        const t1 = Date.now()
        const result = await compareFn(path1, path2, { compareContent: true })
        if (result.diffSet && result.totalFiles !== 54099) {
            console.error(`Different number of files found: ${result.totalFiles}`)
            process.exit(1)
        }
        const t2 = new Date().getTime()
        const heapMb = Math.round(process.memoryUsage().heapUsed / MB)
        const heapOk = heapMb < MAX_HEAP_MB
        console.log(`${(t2 - t1) / 1000}s, heap: ${heapMb}MB, ${heapOk ? 'OK' : 'FAIL'}`)
    }
    console.log("Done")
}

async function main() {
    await testHeap('sync', compareSync)
    await testHeap('async', compare)
}

main().catch(error => console.error(error))
