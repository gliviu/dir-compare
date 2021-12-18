import { Reason } from "../..";
import { SamePromise } from "./SamePromise";

export type FileEqualityPromise = {
    same?: boolean;
    reason?: Reason;
    samePromise?: Promise<SamePromise>;
};
