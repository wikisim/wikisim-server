import { get_id_to_file_map } from "./get_id_to_file_map.ts";
import { parse_request_url } from "./parse_request_url.ts";


if (import.meta.main) {
    main_server();
}

function main_server() {
    Deno.serve(async (req) =>
    {
        const { data, error: error1 } = parse_request_url(req.url);
        if (error1) return error_response(error1);

        const { id_and_version, file_path } = data;
        const { map, error: error2 } = await get_id_to_file_map(id_and_version);
        if (error2) return error_response(error2);

        return new Response(`Requested: "${id_and_version.to_str()}", "${file_path}" returned map: ${JSON.stringify([...map.entries()])}`, { status: 200 });
    });
}


function error_response(error: { message: string, status_code: number }): Response
{
    return new Response(error.message, { status: error.status_code });
}
