
import { deno_get_supabase_as_anon } from "./deno_get_supabase.ts"
import { get_id_to_file_map } from "./get_id_to_file_map.ts"
import { get_url_to_file } from "./get_url_to_file.ts"
import { parse_request_url } from "./parse_request_url.ts"


if (import.meta.main)
{
    main_server()
}


function main_server()
{
    Deno.serve(async (req) =>
    {
        const auth_header = req.headers.get("Authorization")
        if (auth_header)
        {
            console.log("Auth header present:", auth_header.substring(0, 20) + "...")
            return error_response("Authorization header should not be sent from pages hosting insecure interactables code", 400)
        }

        const supabase = deno_get_supabase_as_anon()

        const { data, error: parse_url_error } = parse_request_url(req.url)
        if (parse_url_error) return error_response(parse_url_error)

        const { id_and_version, file_path } = data
        const { map, error: map_error } = await get_id_to_file_map(supabase, id_and_version)
        if (map_error) return error_response(map_error)

        const { url, error: url_to_file_error } = await get_url_to_file(supabase, map, file_path)
        if (url_to_file_error) return error_response(url_to_file_error)

        return new Response(`Requested: "${id_and_version.to_str()}", "${file_path}" returned map: ${JSON.stringify([...map.entries()])}, url to resource: ${url}`, { status: 200 })
    })
}


function error_response(error: { message: string, status_code: number } | string, status_code=500): Response
{
    if (typeof error === "string")
    {
        return new Response(error, { status: status_code })
    }

    return new Response(error.message, { status: error.status_code })
}
