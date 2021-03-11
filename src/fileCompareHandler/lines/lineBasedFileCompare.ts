import {lineBasedCompareSync} from './compareSync'
import {lineBasedCompareAsync} from './compareAsync'
import { CompareFileHandler } from '../../types'

/**
 * Compare files line by line with options to ignore
 * line endings and white space differences.
 */
export const lineBasedFileCompare: CompareFileHandler = {
    compareSync: lineBasedCompareSync, 
    compareAsync: lineBasedCompareAsync
}
