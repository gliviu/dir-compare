import { compareSync, compare, Options, fileCompareHandlers } from "../../src"
import path = require('path')
import { CompareFn } from "./CompareFn"

const PATH1 = path.join(__dirname, 'res/line-based-handler/lf')
const PATH2 = path.join(__dirname, 'res/line-based-handler/crlf-spaces')
const BASE_OPTIONS: Options = {
    compareContent: true,
    compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
    compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
    ignoreLineEnding: true,
    ignoreWhiteSpaces: true,
    ignoreEmptyLines: true,
}
const MAX_BUFFER_SIZE = 100

function warmup() {
    const baseOptions: Options = {
        compareContent: true,
        compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
        compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
        ignoreLineEnding: true,
        ignoreWhiteSpaces: true,
        ignoreEmptyLines: true,
    }
    for (let i = 1; i < 50; i++) {
        compareSync(PATH1, PATH2, baseOptions)
    }
}

async function runSingleTest(compareFn: CompareFn): Promise<void> {
    const durations: number[] = []
    for (let bufferSize = 1; bufferSize < MAX_BUFFER_SIZE; bufferSize++) {
        const options = {
            ...BASE_OPTIONS,
            lineBasedHandlerBufferSize: bufferSize
        }
        const t1 = Date.now()
        const res = await compareFn(PATH1, PATH2, options)
        const duration = Date.now() - t1
        durations.push(duration)
        const ok = res.same
        const testResult = ok ? `ok ${duration}ms` : 'fail'
        console.log(`bufferSize ${bufferSize}: ${testResult}`)
        if (!ok) {
            process.exit(1)
        }
    }
    const bufferSizeUseOk = durations[0] > durations[4] * 2
    if (!bufferSizeUseOk) {
        console.log('Fail: Buffer size not used')
        process.exit(1)
    }

}

async function main() {
    console.log("Start line based handler test")
    warmup()
    
    console.log('Sync')
    await runSingleTest(compareSync)

    console.log('Async')
    await runSingleTest(compare)
    
    console.log("Done")
}

main()
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
