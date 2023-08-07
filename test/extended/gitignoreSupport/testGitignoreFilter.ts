import { compareSync, compare, Options, Result } from 'dir-compare'
import { getGitignoreFilter } from './gitignoreFilter.js'
import { join } from 'path'
import { readFileSync } from 'fs'
import { strict as assert } from 'node:assert';
import { EOL } from 'os'

const tests = [
    {
        // File 'y/z/a2' is wrongly reported as ignored. See globby issue #255.
        id: 't001',
        description: 'Respects .gitignore files and ignores .git directories',
        d1: join(process.cwd(), 'fixture/test1'),
        d2: join(process.cwd(), 'fixture/test1'),
        print: false
    },
    {
        id: 't002',
        description: 'Supports independent left/right gitignore files',
        d1: join(process.cwd(), 'fixture/test1'),
        d2: join(process.cwd(), 'fixture/test2'),
        print: false
    },
    {
        // Files 'y/z/a*' and 'y/a*' are wrongly reported as not ignored. See globby issue #255.
        id: 't003',
        description: 'Does not require the compared directories to be the root of a git repo',
        d1: join(process.cwd(), 'fixture/test3'),
        d2: join(process.cwd(), 'fixture/test3'),
        print: false
    },
    {
        id: 't004',
        description: 'Supports exclude filters',
        d1: join(process.cwd(), 'fixture/test4'),
        d2: join(process.cwd(), 'fixture/test4'),
        options: {
            excludeFilter: '*.js',
        },
        print: false
    },
    {
        id: 't005',
        description: 'Supports include filters',
        d1: join(process.cwd(), 'fixture/test4'),
        d2: join(process.cwd(), 'fixture/test4'),
        options: {
            includeFilter: '*.txt',
        },
        print: false
    },
]

function formatResult(result: Result) {
    const resArray: string[] = []
    resArray.push(`Directories are ${result.same ? 'identical' : 'different'}`)

    resArray.push(`Statistics - equal entries: ${result.equal}, distinct entries: ${result.distinct}, left only entries: ${result.left}, right only entries: ${result.right}, differences: ${result.differences}`)

    if (!result.diffSet) {
        return ""
    }

    result.diffSet.forEach(dif => resArray.push(`${dif.relativePath} ${dif.name1} ${dif.name2} ${dif.state}`))

    // Convert backslashes to forward slashes for Windows compatibility.
    return resArray.join(EOL).replaceAll('\\', '/')
}

async function test() {
    // Sync
    for (const test of tests) {
        const options: Options = {
            compareSize: true,
            compareContent: false,
            filterHandler: getGitignoreFilter(test.d1, test.d2),
            ...test.options
        }
        const res: Result = compareSync(test.d1, test.d2, options)
        if (test.print) {
            console.log(`Test ${test.id}`)
            console.log(formatResult(res))
            return
        }
        const expected = readFileSync(`expected/${test.id}.txt`).toString()
        assert.equal(formatResult(res), expected, `Test ${test.id} failed`)
        console.log(`Sync test ${test.id} OK`)
    }

    // Async
    for (const test of tests) {
        const options: Options = {
            compareSize: true,
            compareContent: false,
            filterHandler: getGitignoreFilter(test.d1, test.d2),
            ...test.options
        }
        const res: Result = await compare(test.d1, test.d2, options)
        if (test.print) {
            // Ignore printing for async tests
            return
        }
        const expected = readFileSync(`expected/${test.id}.txt`).toString()
        assert.equal(formatResult(res), expected, `Test ${test.id} failed`)
        console.log(`Async test ${test.id} OK`)
    }

}

test()


