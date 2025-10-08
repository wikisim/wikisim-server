import { parse_request_url } from "./parse_request_url.ts";


if (import.meta.main) {
    main_server();
}

function main_server() {
    Deno.serve((req) =>
    {
        const { data, error } = parse_request_url(req.url);
        if (error)
        {
            return new Response(error.message, { status: error.status_code });
        }
        const { id_and_version, file_path } = data;

        return new Response(`Requested: "${id_and_version.to_str()}", "${file_path}"`)
    });
}
