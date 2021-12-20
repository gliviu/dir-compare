import { CompareFileAsync, CompareFileSync, CompareNameHandler, Options, ResultBuilder } from "./types";


/**
 * Clone of {@link Options} where fields with default values are
 * expressed as non optional.
 */
export interface ExtOptions extends Options {
    dateTolerance: number
    resultBuilder: ResultBuilder
    compareFileSync: CompareFileSync
    compareFileAsync: CompareFileAsync
    compareNameHandler: CompareNameHandler
}