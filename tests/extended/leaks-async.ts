import { compare } from "../..";
import os = require('os')
const path1 = `/${os.tmpdir()}/linux-4.3`;
const path2 = `/${os.tmpdir()}/linux-4.4`;
const noTests = 100

async function main() {
    console.log("Start async heap test");
    for (let i = 0; i < noTests; i++) {
        const t1 = Date.now()
        const result = await compare(path1, path2, { compareContent: true })
        if (result.diffSet && result.totalFiles !== 54099) {
            console.error(`Different number of files found: ${result.totalFiles}`)
            process.exit(1)
        }
        const t2 = new Date().getTime()
        console.log(`${i} ${(t2 - t1) / 1000}s, heap: ${process.memoryUsage().heapUsed}`);
    }
    console.log("Done");
}

main()
.catch(error => {
    console.error(error)
    process.exit(1)
})
