import { compare, Statistics, compareSync } from "../..";
import os = require('os')

interface AsyncRes {
    res: Statistics | string,
    testId: number
}

const options = {
    compareContent: true,
    noDiffSet: true
};

const path1 = `/${os.tmpdir()}/linux-4.3`;
const path2 = `/${os.tmpdir()}/linux-4.4`;

const expected = '{"distinct":8543,"equal":46693,"left":792,"right":1755,"distinctFiles":8543,"equalFiles":43167,"leftFiles":750,"rightFiles":1639,"distinctDirs":0,"equalDirs":3526,"leftDirs":42,"rightDirs":116,"leftBrokenLinks":0,"rightBrokenLinks":0,"distinctBrokenLinks":0,"same":false,"differences":11090,"differencesFiles":10932,"differencesDirs":158,"total":57783,"totalFiles":54099,"totalDirs":3684,"totalBrokenLinks":0}'

const noTests = 5

let referenceTime = Date.now()
let successfulTimerHitCount = 0
let failedlTimerHitCount = 0
const EXPECTED_DIFF_MS = 500
const ERR_THRESHOLD_MS = 70
async function main() {
    console.log("Start async test");

    const timer = setInterval(() => printTimeDiff(), EXPECTED_DIFF_MS)
    const result = await compare(path1, path2, options)

    clearInterval(timer)

    const ok = JSON.stringify(result) === expected
    const okSuccessfullTimerHitCount = successfulTimerHitCount > 4
    const okFailedTimerHitCount = failedlTimerHitCount < 4

    console.log(`Async test - successfullTimerHit: %s, failedTimerHit: %s, result: %s`,
        (okSuccessfullTimerHitCount ? 'OK' : 'FAIL'),
        (okFailedTimerHitCount ? 'OK' : 'FAIL'),
        (ok ? 'OK' : 'FAIL'))

    if (!ok || !okSuccessfullTimerHitCount || !okFailedTimerHitCount) {
        process.exit(1)
    }

    console.log("Done");
}

function printTimeDiff() {
    const diffMs = Date.now() - referenceTime
    const ok = Math.abs(EXPECTED_DIFF_MS - diffMs) < ERR_THRESHOLD_MS
    console.log('Diff: %d %s', diffMs, (ok ? 'OK' : 'FAIL'))
    referenceTime = Date.now()
    if (ok) {
        successfulTimerHitCount++
    } else {
        failedlTimerHitCount++
    }
}

main().catch(error => {
    console.error(error)
    process.exit(1)
})
