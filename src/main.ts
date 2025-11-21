// Run this locally with:
//    deno run --allow-net --allow-env --allow-read main.ts
// Also can run debugger through visual studio code .vscode/launch.json config "Debug Deno Server"

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

        const { resource, error: url_to_file_error } = await get_url_to_file(supabase, map, file_path)
        if (url_to_file_error !== null) return error_response(url_to_file_error)

        // If content_type is "text/html", we reverse proxy the content because
        // the supabase s3 bucket will not serve HTML files with the correct
        // Content-Type header.
        if (resource.content_type?.startsWith("text/html"))
        {
            const content_response = await reverse_proxy_fetch(resource)
            return content_response
        }

        const headers = new Headers()
        headers.set("Content-Type", resource.content_type || "application/octet-stream")
        headers.set("Location", resource.url)

        // Disable caching due to Deno edge cache truncating Location header
        const cache_control = "no-store"
        // // Set cache time to 1 day
        // const cache_control = auth_header
        //     ? "private, max-age=86400, must-revalidate"
        //     : "public, max-age=86400"
        headers.set("Cache-Control", cache_control)

        return new Response("", { status: 302, headers})
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


async function reverse_proxy_fetch(resource: { url: string, content_type: string | undefined }): Promise<Response>
{
    // Note: In a real reverse proxy, we would stream the response back to the client
    // and copy all headers. Here we just do a simple fetch for demonstration purposes.
    const body: ReadableStream<Uint8Array> | null = (await fetch(resource.url)).body
    const content_type = resource.content_type || "application/octet-stream"
    return new Response(body, { status: 200, headers: { "Content-Type": content_type } })
}
