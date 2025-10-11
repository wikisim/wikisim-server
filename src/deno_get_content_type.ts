// Shared between
// wikisim-supabase/supabase/functions/_shared/deno_get_content_type.ts
// wikisim-server/src/deno_get_content_type.ts

import { contentType } from "jsr:@std/media-types"

export function deno_get_content_type(file_path: string): string | undefined
{
    // contentType from std/media-types only accepts the file extension
    file_path = file_path.split(".").slice(-1)[0]
    return contentType(file_path)
}
