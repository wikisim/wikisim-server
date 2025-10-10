import { contentType } from "jsr:@std/media-types"

import { ERRORS, INTERACTABLES_FILES_BUCKET } from "./core.ts"
import { SupabaseClient } from "./deno_get_supabase.ts"


type Result =
{
    resource: { url: string, content_type: string | undefined }
    error: null
} | {
    resource: null
    error: string | { message: string, status_code: number }
}

export async function get_url_to_file(supabase: SupabaseClient, map: Map<string, string>, file_path: string): Promise<Result>
{
    const file_id = map.get(file_path)
    if (!file_id)
    {
        const message = `File path "${file_path}" not found in map`
        return { resource: null, error: { message, status_code: 404 }}
    }

    // Look up file_id in supabase table to get the file name and check if still
    // allowed to serve it or not
    const { data: file_metadatas, error: file_metadata_error } = await supabase
        .from("public_storage_files_metadata")
        .select("file_id, file_hash_filename, allowed")
        .eq("file_id", file_id)
        .limit(1)

    if (file_metadata_error)
    {
        console.error(`Error fetching metadata for file id "${file_id}":`, file_metadata_error)
        return { resource: null, error: ERRORS.ERR46.message }
    }

    const file_metadata = file_metadatas[0]
    if (file_metadata?.allowed === false)
    {
        return { resource: null, error: { message: ERRORS.ERR47.message, status_code: 404 }}
    }

    const { data: { publicUrl } } = await supabase.storage
        .from(INTERACTABLES_FILES_BUCKET)
        .getPublicUrl(file_metadata.file_hash_filename)

    // file_hash_filename should not include file extension so we can't use it
    // to get mime type
    const content_type: string | undefined = contentType(file_path)

    return { resource: { url: publicUrl, content_type }, error: null }
}
