import { Options, Result } from "../../src";

export type CompareFn = (left: string, right: string, options: Options) => Promise<Result> | Result;
