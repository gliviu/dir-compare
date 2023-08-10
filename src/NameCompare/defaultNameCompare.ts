import { ExtOptions } from "../ExtOptions"
import { CompareNameHandler } from "../types"
import { StringCompareResult } from "./StringCompareResult"

/**
 * The default implementation uses the 'strcmp' function for comparing file or directory names.
 */
export const defaultNameCompare: CompareNameHandler = (name1: string, name2: string, options: ExtOptions): StringCompareResult => {
	if (options.ignoreCase) {
		name1 = name1.toLowerCase()
		name2 = name2.toLowerCase()
	}
	return strcmp(name1, name2)
}

function strcmp(str1: string, str2: string): StringCompareResult {
	return ((str1 === str2) ? 0 : ((str1 > str2) ? 1 : -1))
}
