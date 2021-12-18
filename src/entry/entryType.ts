import { DifferenceType } from ".."
import { OptionalEntry } from "../types/OptionalEntry"

export = {
	/**
	 * One of 'missing','file','directory','broken-link'
	 */
	getType (entry: OptionalEntry): DifferenceType {
		if (!entry) {
			return 'missing'
		}
		if (entry.isBrokenLink) {
			return 'broken-link'
		}
		if (entry.isDirectory) {
			return 'directory'
		}
		return 'file'
	}
}