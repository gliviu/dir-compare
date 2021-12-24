import { ExtOptions } from "../ExtOptions"
import { StringCompareResult } from "./StringCompareResult"

/**
 * Name comparator used when dir-compare is called to compare two files.
 * In this case the file name is ignored (ie. comparing a1.txt and a2.txt 
 * will return true if file contents are identical).
 */
export function fileBasedNameCompare(name1: string, name2: string, options: ExtOptions): StringCompareResult {
	return 0
}

