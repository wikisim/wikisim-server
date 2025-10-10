import { ERRORS, INTERACTABLES_FILES_BUCKET } from "./core.ts"
import { SupabaseClient } from "./deno_get_supabase.ts"


type Result =
{
    url: string
    error: null
} | {
    url: null
    error: string | { message: string, status_code: number }
}

export async function get_url_to_file(supabase: SupabaseClient, map: Map<string, string>, file_path: string): Promise<Result>
{
    const file_id = map.get(file_path)
    if (!file_id)
    {
        const message = `File path "${file_path}" not found in map`
        return { url: null, error: { message, status_code: 404 }}
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
        return { url: null, error: ERRORS.ERR46.message }
    }

    const file_metadata = file_metadatas[0]
    if (file_metadata?.allowed === false)
    {
        return { url: null, error: { message: ERRORS.ERR47.message, status_code: 404 }}
    }

    const { data: { publicUrl } } = await supabase.storage
        .from(INTERACTABLES_FILES_BUCKET)
        .getPublicUrl(file_metadata.file_hash_filename)

    return { url: publicUrl, error: null }
}
