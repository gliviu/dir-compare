import { Entry, PermissionDeniedState } from "../types"

export function getPermissionDeniedState(entry1: Entry, entry2: Entry): PermissionDeniedState {
    if (entry1.isPermissionDenied && entry2.isPermissionDenied) {
        return "access-error-both"
    } else if (entry1.isPermissionDenied) {
        return "access-error-left"
    } else if (entry2.isPermissionDenied) {
        return "access-error-right"
    } else {
        return "access-ok"
    }
}

export function getPrmissionDenieStateWhenLeftMissing(entry2: Entry): PermissionDeniedState {
    let permissionDeniedState: PermissionDeniedState = "access-ok"
    if (entry2.isPermissionDenied) {
        permissionDeniedState = "access-error-right"
    }
    return permissionDeniedState
}

export function getPrmissionDenieStateWhenRightMissing(entry1: Entry): PermissionDeniedState {
    let permissionDeniedState: PermissionDeniedState = "access-ok"
    if (entry1.isPermissionDenied) {
        permissionDeniedState = "access-error-left"
    }
    return permissionDeniedState
}
