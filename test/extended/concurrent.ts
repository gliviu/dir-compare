import { compare, Statistics } from "../../src"
import os = require('os')
import { deepCompare } from "./deepCompare"

interface AsyncRes {
    res: Statistics | string,
    testId: number
}

const options = {
    compareContent: true,
    noDiffSet: true
}

const path1 = `/${os.tmpdir()}/linux-4.3`
const path2 = `/${os.tmpdir()}/linux-4.4`

const expected = '{"distinct":8543,"equal":46693,"left":792,"right":1755,"distinctFiles":8543,"equalFiles":43167,"leftFiles":750,"rightFiles":1639,"distinctDirs":0,"equalDirs":3526,"leftDirs":42,"rightDirs":116,"brokenLinks":{"leftBrokenLinks":0,"rightBrokenLinks":0,"distinctBrokenLinks":0,"totalBrokenLinks":0},"permissionDenied":{"leftPermissionDenied":0,"rightPermissionDenied":0,"distinctPermissionDenied":0,"totalPermissionDenied":0},"same":false,"differences":11090,"differencesFiles":10932,"differencesDirs":158,"total":57783,"totalFiles":54099,"totalDirs":3684}'

const noTests = 5

async function main() {
    console.log("Start concurrency test")
    const promises: Promise<AsyncRes>[] = []
    for (let testId = 0; testId < noTests; testId++) {
        const promise: Promise<AsyncRes> = compare(path1, path2, options)
            .then(res => {
                console.log(`finished ${testId} - ${new Date()}`)
                return { testId, res }
            })
            .catch(error => {
                console.log(`error occurred: ${error}`)
                return { testId, res: error.toString() }
            })
        promises.push(promise)
    }
    await Promise.all(promises)
        .then(results => {
            let failedTests = false
            for (const result of results) {
                const actual = result.res
                const ok = deepCompare(actual, JSON.parse(expected))
                console.log(`${result.testId} ` + (ok ? 'OK' : `FAIL - ${JSON.stringify(actual)}`))
                if (!ok) {
                    failedTests = true
                }
            }
            if (failedTests) {
                process.exit(1)
            }
        })
    console.log("Done")
}

main()
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
