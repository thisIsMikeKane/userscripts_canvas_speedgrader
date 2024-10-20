import { Metadata } from "userscript-metadata";
//TODO figure out why linter does not like this. 
// @ts-ignore: Module '"userscripter/build-time"' has no exported member 'BuildConfig'.ts(2305)
import type { BuildConfig } from "userscripter/build-time";

import U from "./src/userscript";

export default function(_: BuildConfig): Metadata {
    return {
        name: U.name,
        version: U.version,
        description: U.description,
        author: U.author,
        match: U.match,
        namespace: U.namespace,
        run_at: U.runAt,
        grant: U.grant,
    };
}
