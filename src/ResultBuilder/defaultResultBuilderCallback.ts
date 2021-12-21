import pathUtils from 'path'
import { DifferenceState, DiffSet, Entry, PermissionDeniedState, Reason, Statistics } from '..'
import { EntryType } from '../Entry/EntryType'
import { ExtOptions } from '../ExtOptions'

export function defaultResultBuilderCallback(entry1: Entry, entry2: Entry, state: DifferenceState, level: number,
    relativePath: string, options: ExtOptions, statistics: Statistics, diffSet: DiffSet, reason: Reason, 
    permissionDeniedState: PermissionDeniedState): void {

    if (options.noDiffSet) {
        return
    }
    diffSet.push({
        path1: entry1 ? pathUtils.dirname(entry1.path) : undefined,
        path2: entry2 ? pathUtils.dirname(entry2.path) : undefined,
        relativePath: relativePath,
        name1: entry1 ? entry1.name : undefined,
        name2: entry2 ? entry2.name : undefined,
        state: state,
        permissionDeniedState,
        type1: EntryType.getType(entry1),
        type2: EntryType.getType(entry2),
        level: level,
        size1: entry1 ? entry1.stat.size : undefined,
        size2: entry2 ? entry2.stat.size : undefined,
        date1: entry1 ? entry1.stat.mtime : undefined,
        date2: entry2 ? entry2.stat.mtime : undefined,
        reason: reason
    })
}
