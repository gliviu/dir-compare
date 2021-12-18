import { DifferenceType, DiffSet, Entry, Reason } from "../..";

export type SamePromise = {
    entry1?: Entry;
    entry2?: Entry;
    same?: boolean;
    error: unknown;
    diffSet?: DiffSet;
    type1?: DifferenceType;
    type2?: DifferenceType;
    reason?: Reason;
};
