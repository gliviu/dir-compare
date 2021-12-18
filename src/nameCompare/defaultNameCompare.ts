import { ExtOptions } from "../types/ExtOptions"

export = function compareName(name1: string, name2: string, options: ExtOptions): number {
	if (options.ignoreCase) {
		name1 = name1.toLowerCase()
		name2 = name2.toLowerCase()
	}
	return strcmp(name1, name2)
}

function strcmp(str1: string, str2: string): number {
	return ((str1 === str2) ? 0 : ((str1 > str2) ? 1 : -1))
}
