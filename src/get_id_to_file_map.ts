import { IdAndVersion } from "./core.ts"
import { SupabaseClient } from "./deno_get_supabase.ts"
import { get_component_by_id_and_version } from "./get_component_by_id_and_version.ts"
import { get_site_map } from "./get_site_map.ts"


type GetIdToFileMapResult =
{
    map: Map<string, string>
    error: null
} | {
    map: null
    error: { message: string, status_code: number }
}
export async function get_id_to_file_map(supabase: SupabaseClient, id_and_version: IdAndVersion): Promise<GetIdToFileMapResult>
{
    const { component, error } = await get_component_by_id_and_version(id_and_version, supabase)
    if (error) return error_response(error.message, error.status_code)

    const { map, error: map_error } = get_site_map(component.result_value, id_and_version.to_str())
    if (map_error) return error_response(map_error.message, map_error.status_code)

    return { map, error: null }
}


function error_response(message: string, status_code: number): GetIdToFileMapResult
{
    return {
        error: {
            message,
            status_code
        },
        map: null,
    }
}
