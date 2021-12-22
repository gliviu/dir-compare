import { compareSync, compare, Options } from "../../src"
import print from '../print'
import Streams from 'memory-streams'
import { readFileSync } from "fs"
import { join } from "path"
import { CompareFn } from "./CompareFn"

interface Test {
    testId: string,
    left: string,
    right: string,
    description: string,
    options: Options,
}

const tests: Test[] = [
    {
        testId: '001',
        description: 'Should handle permission denied errors when options.handlePermissionDenied is enabled',
        left: '/tmp/37-perms-test/t1-files-and-dirs/a',
        right: '/tmp/37-perms-test/t1-files-and-dirs/b',
        options: { compareSize: true, compareContent: true, handlePermissionDenied: true },
    },
    {
        testId: '002',
        description: 'Should support links when dealing with permission denied errors',
        left: '/tmp/37-perms-test/t2-links/a',
        right: '/tmp/37-perms-test/t2-links/b',
        options: { compareSize: true, compareContent: true, handlePermissionDenied: true },
    },
    {
        testId: '003',
        description: 'Should support forbidden root directories',
        left: '/tmp/37-perms-test/t3-root/t1-root-left-dir-ok,root-right-dir-forbidden/a',
        right: '/tmp/37-perms-test/t3-root/t1-root-left-dir-ok,root-right-dir-forbidden/b',
        options: { compareSize: true, compareContent: true, handlePermissionDenied: true },
    },
    {
        testId: '004',
        description: 'Should support forbidden root directories (reversed)',
        left: '/tmp/37-perms-test/t3-root/t1-root-left-dir-ok,root-right-dir-forbidden/b',
        right: '/tmp/37-perms-test/t3-root/t1-root-left-dir-ok,root-right-dir-forbidden/a',
        options: { compareSize: true, compareContent: true, handlePermissionDenied: true },
    },
    {
        testId: '005',
        description: 'Should support forbidden root files',
        left: '/tmp/37-perms-test/t3-root/t2-root-left-file-ok,root-right-file-forbidden.txt/a/test.txt',
        right: '/tmp/37-perms-test/t3-root/t2-root-left-file-ok,root-right-file-forbidden.txt/b/test.txt',
        options: { compareSize: true, compareContent: true, handlePermissionDenied: true },
    },
    {
        testId: '006',
        description: 'Should not report permission denied if files are not compared by content',
        left: '/tmp/37-perms-test/t1-files-and-dirs/a',
        right: '/tmp/37-perms-test/t1-files-and-dirs/b',
        options: { compareSize: true, compareContent: false, handlePermissionDenied: true },
    },
    {
        testId: '010',
        description: 'Should not handle permission denied errors when options.handlePermissionDenied is disabled',
        left: '/tmp/37-perms-test/t1-files-and-dirs/a',
        right: '/tmp/37-perms-test/t1-files-and-dirs/b',
        options: { compareSize: true, compareContent: true, handlePermissionDenied: false },
    },
]

async function runSingleTest(test: Test, compareFn: CompareFn): Promise<void> {
    const outputWriter = new Streams.WritableStream()
    try {
        const compareResult = await compareFn(test.left, test.right, test.options)
        print(compareResult, outputWriter, { showAll: true, wholeReport: true, reason: true })
    } catch (error) {
        outputWriter.write(error.toString())
    }
    const compareResultStr = outputWriter.toString()
    const expectedFilePath = join(__dirname, 'res', '37-perms-expected', `${test.testId}.txt`)
    const expected = readFileSync(expectedFilePath).toString()
    const ok = compareResultStr === expected
    const testResult = ok ? `OK` : 'FAIL ' + compareResultStr
    console.log(`${test.testId} ${test.description}: ${testResult}`)
    if (test.testId === '001') {
        // console.log(compareResultStr)
        // console.log(expected)
    }
    if (!ok) {
        process.exit(1)
    }
}

async function main() {
    console.log("Start permission denied test")
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
