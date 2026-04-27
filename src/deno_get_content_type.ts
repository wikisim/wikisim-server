// Shared between
// wikisim-supabase/supabase/functions/_shared/deno_get_content_type.ts
// wikisim-server/src/deno_get_content_type.ts

// deno-lint-ignore no-import-prefix
import { contentType } from "jsr:@std/media-types@1.1.0"
// deno-lint-ignore no-import-prefix
import * as Sentry from "npm:@sentry/deno@10.49.0"

import { original_console } from "./deno_setup_sentry.ts"


export function deno_get_content_type(file_path: string): string | undefined
{
    // contentType from std/media-types only accepts the file extension
    const file_extension = file_path.split(".").slice(-1)[0]
    let content_type = contentType(file_extension)

    if (!content_type)
    {

        if (file_extension === "shx") content_type = "application/x-shx"
        else if (file_extension === "shp") content_type = "application/x-shp"
        else if (file_extension === "cpg") content_type = "application/x-cpg"
        else if (file_extension === "prj") content_type = "application/x-prj"
        else
        {
            const error_message = `Could not determine content type for extension "${file_extension}"`
            original_console.error(error_message + ` for file_path "${file_path}"`)

            Sentry.withScope(scope => {
                scope.setExtra("file_path", file_path)
                Sentry.captureException(error_message)
            })
        }
    }

    return content_type
}
