import { SupabaseClient } from "npm:@supabase/supabase-js@2.44.2"

import { ERRORS, INTERACTABLE_FILE_SIGNED_URL_EXPIRY_SECONDS, INTERACTABLES_FILES_BUCKET } from "./core.ts"


type Result =
{
    url: string
    error: null
} | {
    url: null
    error: string
}

export async function get_url_to_file(supabase: SupabaseClient, map: Map<string, string>, file_path: string): Promise<Result>
{
    const file_id = map.get(file_path)
    if (!file_id) return { url: null, error: `File path "${file_path}" not found in map` }

    // Look up file_id in supabase table to get the file name and check if still publicly accessible
    const file_hash_name = "TODO NEXT"

    const { data, error } = await supabase.storage
        .from(INTERACTABLES_FILES_BUCKET)
        .createSignedUrl(file_hash_name, INTERACTABLE_FILE_SIGNED_URL_EXPIRY_SECONDS)

    if (error || !data.signedUrl)
    {
        console.error(`Error creating signed URL for file id "${file_id}":`, error)
        return { url: null, error: ERRORS.ERR46.message }
    }

    const url = data.signedUrl

    return { url, error: null }
}
