import { SupabaseClient } from "npm:@supabase/supabase-js@2.44.2"

import { IdAndVersion } from "./core.ts"
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
            ["index.html", "3ec1780c-ad44-4215-935b-4e2e0052eb03"],
            ["script.js", "74baff2c-3362-4442-9ce5-afb854caacb2"],
            ["style.css", "7b5d246d-a4f6-459d-86f4-4206c928ea33"],
            ["assets/wikisim.png", "244c7499-8441-41b8-8d50-a502f03eb350"],
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
