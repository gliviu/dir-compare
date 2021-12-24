import { ExtOptions } from "../ExtOptions"
import { StringCompareResult } from "./StringCompareResult"

/**
 * Name comparator used when dir-compare is called to compare two directories.
 */
export function defaultNameCompare(name1: string, name2: string, options: ExtOptions): StringCompareResult {
	if (options.ignoreCase) {
		name1 = name1.toLowerCase()
		name2 = name2.toLowerCase()
	}
	return strcmp(name1, name2)
}

function strcmp(str1: string, str2: string): StringCompareResult {
	return ((str1 === str2) ? 0 : ((str1 > str2) ? 1 : -1))
}
