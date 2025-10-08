import { createClient } from "npm:@supabase/supabase-js@2.44.2"

import { supabase_anon_key, supabase_url } from "./core.ts"
import { get_id_to_file_map } from "./get_id_to_file_map.ts"
// import { get_url_to_file } from "./get_url_to_file.ts"
import { parse_request_url } from "./parse_request_url.ts"


if (import.meta.main)
{
    main_server()
}


function main_server()
{
    Deno.serve(async (req) =>
    {
        const { data, error: parse_url_error } = parse_request_url(req.url)
        if (parse_url_error) return error_response(parse_url_error)

        const supabase = createClient(supabase_url, supabase_anon_key)

        const { id_and_version, file_path } = data
        const { map, error: map_error } = await get_id_to_file_map(supabase, id_and_version)
        if (map_error) return error_response(map_error)

        // const url_to_resource = get_url_to_file(map, file_path)

        return new Response(`Requested: "${id_and_version.to_str()}", "${file_path}" returned map: ${JSON.stringify([...map.entries()])}`, { status: 200 })
    })
}


function error_response(error: { message: string, status_code: number }): Response
{
    return new Response(error.message, { status: error.status_code })
}
