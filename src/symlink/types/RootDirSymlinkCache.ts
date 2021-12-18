/**
 * Symlink cache for one of the left or right root directories.
 */

import { SymlinkPath } from "./SymlinkPath";

export type RootDirSymlinkCache = {
    /**
     * True if this symlink has already been traversed.
     */
    [key: SymlinkPath]: boolean;
};
