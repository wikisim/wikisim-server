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
    if (2 > Math.random())
    {
        // Temporary hardcoded map for testing
        return { map: new Map([
            ["index.html", "1672acd0-bae1-422a-b115-93dcaeaf5c9e"],
            ["script.js", "e8d33d4e-911c-4636-97fb-275e69a30ce6"],
            ["style.css", "c2f40503-e8d8-4c78-95aa-6bfea2c680ae"],
            ["assets/wikisim.png", "2e25fd96-efa9-48d2-a05b-191eda64c6ce"],
            // Just to show we can access other fields
            ["not used title", id_and_version.to_str()],
        ]), error: null }
    }

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
