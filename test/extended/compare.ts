import { compare, compareSync, fileCompareHandlers, Options } from "../../src"
import { CompareFn } from "./CompareFn"
import { deepCompare } from "./deepCompare"

interface Test {
    testId: string,
    left: string,
    right: string,
    description: string,
    options: Options,
    expected: string
}

const tests: Test[] = [
    {
        testId: '001',
        description: 'compare by file size',
        left: '/tmp/linux-4.3',
        right: '/tmp/linux-4.4',
        options: { noDiffSet: true, compareSize: true },
        expected: '{"distinct":8349,"equal":46887,"left":792,"right":1755,"distinctFiles":8349,"equalFiles":43361,"leftFiles":750,"rightFiles":1639,"distinctDirs":0,"equalDirs":3526,"leftDirs":42,"rightDirs":116,"brokenLinks":{"leftBrokenLinks":0,"rightBrokenLinks":0,"distinctBrokenLinks":0,"totalBrokenLinks":0},"permissionDenied":{"leftPermissionDenied":0,"rightPermissionDenied":0,"distinctPermissionDenied":0,"totalPermissionDenied":0},"same":false,"differences":10896,"differencesFiles":10738,"differencesDirs":158,"total":57783,"totalFiles":54099,"totalDirs":3684}'
    },
    {
        testId: '002_1',
        description: 'compare by file content',
        left: '/tmp/linux-4.3',
        right: '/tmp/linux-4.4',
        options: { noDiffSet: true, compareContent: true },
        expected: '{"distinct":8543,"equal":46693,"left":792,"right":1755,"distinctFiles":8543,"equalFiles":43167,"leftFiles":750,"rightFiles":1639,"distinctDirs":0,"equalDirs":3526,"leftDirs":42,"rightDirs":116,"brokenLinks":{"leftBrokenLinks":0,"rightBrokenLinks":0,"distinctBrokenLinks":0,"totalBrokenLinks":0},"permissionDenied":{"leftPermissionDenied":0,"rightPermissionDenied":0,"distinctPermissionDenied":0,"totalPermissionDenied":0},"same":false,"differences":11090,"differencesFiles":10932,"differencesDirs":158,"total":57783,"totalFiles":54099,"totalDirs":3684}'
    },
    {
        testId: '002_3',
        description: 'compare big files by content',
        left: '/tmp/dircompare',
        right: '/tmp/dircompare',
        options: { noDiffSet: true, compareContent: true },
        expected: '{"distinct":0,"equal":3,"left":0,"right":0,"distinctFiles":0,"equalFiles":3,"leftFiles":0,"rightFiles":0,"distinctDirs":0,"equalDirs":0,"leftDirs":0,"rightDirs":0,"brokenLinks":{"leftBrokenLinks":0,"rightBrokenLinks":0,"distinctBrokenLinks":0,"totalBrokenLinks":0},"permissionDenied":{"leftPermissionDenied":0,"rightPermissionDenied":0,"distinctPermissionDenied":0,"totalPermissionDenied":0},"differences":0,"differencesFiles":0,"differencesDirs":0,"total":3,"totalFiles":3,"totalDirs":0,"same":true}'
    },
    {
        testId: '003',
        description: 'filter files by extension',
        left: '/tmp/linux-4.3',
        right: '/tmp/linux-4.4',
        options: { noDiffSet: true, includeFilter: '*.c', compareContent: true },
        expected: '{"distinct":5299,"equal":20010,"left":251,"right":571,"distinctFiles":5299,"equalFiles":16484,"leftFiles":209,"rightFiles":455,"distinctDirs":0,"equalDirs":3526,"leftDirs":42,"rightDirs":116,"brokenLinks":{"leftBrokenLinks":0,"rightBrokenLinks":0,"distinctBrokenLinks":0,"totalBrokenLinks":0},"permissionDenied":{"leftPermissionDenied":0,"rightPermissionDenied":0,"distinctPermissionDenied":0,"totalPermissionDenied":0},"same":false,"differences":6121,"differencesFiles":5963,"differencesDirs":158,"total":26131,"totalFiles":22447,"totalDirs":3684}'
    },
    {
        testId: '004',
        description: 'custom file comparison handlers',
        left: '/tmp/linux-4.3',
        right: '/tmp/linux-4.4',
        options: {
            noDiffSet: true, includeFilter: '*.c', compareContent: true,
            compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
            compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
            ignoreLineEnding: true, ignoreWhiteSpaces: true
        },
        expected: '{"distinct":5292,"equal":20017,"left":251,"right":571,"distinctFiles":5292,"equalFiles":16491,"leftFiles":209,"rightFiles":455,"distinctDirs":0,"equalDirs":3526,"leftDirs":42,"rightDirs":116,"brokenLinks":{"leftBrokenLinks":0,"rightBrokenLinks":0,"distinctBrokenLinks":0,"totalBrokenLinks":0},"permissionDenied":{"leftPermissionDenied":0,"rightPermissionDenied":0,"distinctPermissionDenied":0,"totalPermissionDenied":0},"same":false,"differences":6114,"differencesFiles":5956,"differencesDirs":158,"total":26131,"totalFiles":22447,"totalDirs":3684}'
    },
    {
        testId: '005',
        description: 'filter files by extension with globstar',
        left: '/tmp/linux-4.3',
        right: '/tmp/linux-4.4',
        options: { noDiffSet: true, includeFilter: '**/clocksource/*.h,/include/keys/*', compareContent: true },
        expected: '{"distinct":4,"equal":3540,"left":42,"right":116,"distinctFiles":4,"equalFiles":14,"leftFiles":0,"rightFiles":0,"distinctDirs":0,"equalDirs":3526,"leftDirs":42,"rightDirs":116,"brokenLinks":{"leftBrokenLinks":0,"rightBrokenLinks":0,"distinctBrokenLinks":0,"totalBrokenLinks":0},"permissionDenied":{"leftPermissionDenied":0,"rightPermissionDenied":0,"distinctPermissionDenied":0,"totalPermissionDenied":0},"same":false,"differences":162,"differencesFiles":4,"differencesDirs":158,"total":3702,"totalFiles":18,"totalDirs":3684}'
    },
    {
        testId: '006',
        description: 'exclude files by extension with globstar',
        left: '/tmp/linux-4.3',
        right: '/tmp/linux-4.4',
        options: { noDiffSet: true, excludeFilter: '**/clocksource/*.h,/include/keys/*', compareContent: true },
        expected: '{"distinct":8539,"equal":46679,"left":792,"right":1755,"distinctFiles":8539,"equalFiles":43153,"leftFiles":750,"rightFiles":1639,"distinctDirs":0,"equalDirs":3526,"leftDirs":42,"rightDirs":116,"brokenLinks":{"leftBrokenLinks":0,"rightBrokenLinks":0,"distinctBrokenLinks":0,"totalBrokenLinks":0},"permissionDenied":{"leftPermissionDenied":0,"rightPermissionDenied":0,"distinctPermissionDenied":0,"totalPermissionDenied":0},"same":false,"differences":11086,"differencesFiles":10928,"differencesDirs":158,"total":57765,"totalFiles":54081,"totalDirs":3684}'
    },
    {
        testId: '007',
        description: 'exclude directory with globstar',
        left: '/tmp/linux-4.3',
        right: '/tmp/linux-4.4',
        options: { noDiffSet: true, excludeFilter: '**/crypto/internal', compareContent: true },
        expected: '{"distinct":8542,"equal":46685,"left":792,"right":1755,"distinctFiles":8542,"equalFiles":43160,"leftFiles":750,"rightFiles":1639,"distinctDirs":0,"equalDirs":3525,"leftDirs":42,"rightDirs":116,"brokenLinks":{"leftBrokenLinks":0,"rightBrokenLinks":0,"distinctBrokenLinks":0,"totalBrokenLinks":0},"permissionDenied":{"leftPermissionDenied":0,"rightPermissionDenied":0,"distinctPermissionDenied":0,"totalPermissionDenied":0},"same":false,"differences":11089,"differencesFiles":10931,"differencesDirs":158,"total":57774,"totalFiles":54091,"totalDirs":3683}'
    },
    {
        testId: '008',
        description: 'compare files',
        left: '/tmp/dircompare/linux-4.3.tar.gz',
        right: '/tmp/dircompare/linux-4.3.tar.gz',
        options: { noDiffSet: true, compareContent: true },
        expected: '{"distinct":0,"equal":1,"left":0,"right":0,"distinctFiles":0,"equalFiles":1,"leftFiles":0,"rightFiles":0,"distinctDirs":0,"equalDirs":0,"leftDirs":0,"rightDirs":0,"brokenLinks":{"leftBrokenLinks":0,"rightBrokenLinks":0,"distinctBrokenLinks":0,"totalBrokenLinks":0},"permissionDenied":{"leftPermissionDenied":0,"rightPermissionDenied":0,"distinctPermissionDenied":0,"totalPermissionDenied":0},"differences":0,"differencesFiles":0,"differencesDirs":0,"total":1,"totalFiles":1,"totalDirs":0,"same":true}'
    },
]

async function runSingleTest(test: Test, compareFn: CompareFn): Promise<void> {
    const t1 = Date.now()
    const compareResult = await compareFn(test.left, test.right, test.options)
    const t2 = Date.now()
    const duration = (t2 - t1) / 1000
    const ok = deepCompare(compareResult, JSON.parse(test.expected))
    const testResult = ok ? `ok ${duration} s` : 'fail - ' + JSON.stringify(compareResult)
    console.log(`${test.testId} ${test.description}: ${testResult}`)
    if (!ok) {
        process.exit(1)
    }
}

async function main() {
    console.log("Start compare test")
    console.log('Sync')
    for (const test of tests) {
        await runSingleTest(test, compareSync)
    }

    console.log('Async')
    for (const test of tests) {
        await runSingleTest(test, compare)
    }
    console.log("Done")
}

main()
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
