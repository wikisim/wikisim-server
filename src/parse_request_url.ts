import { IdAndVersion, parse_id } from "../lib/core/src/data/id.ts";
import { ERRORS } from "../lib/core/src/errors.ts";
import { truncate } from "../lib/core/src/utils/truncate.ts";


type ParsedRequestUrlResult =
{
    error: {
        message: string
        status_code: number
    }
    data: null
} | {
    error: null
    data: {
        id_and_version: IdAndVersion
        file_path: string
    }
}

export function parse_request_url(url: string): ParsedRequestUrlResult
{
    try {
        const parsed_url = new URL(url);
        const pathname = parsed_url.pathname;

        // Expecting URL format: /<id and version>(/<file_path>)?
        const path_parts = pathname.split("/").filter(part => part.length > 0);
        if (path_parts.length === 0)
        {
            return error_response("No ID and version specified in URL", 400);
        }

        const id_and_version_str = path_parts[0];
        let id_and_version: IdAndVersion;
        try
        {
            id_and_version = parse_id(id_and_version_str, true);
        }
        catch (_)
        {
            return error_response(`ID and version not found in "${truncate(id_and_version_str)}", expected something like 1021v5`, 404);
        }

        const file_path = path_parts.slice(1).join("/") || "index.html";

        return {
            error: null,
            data: { id_and_version, file_path }
        };
    } catch (err: unknown) {
        console.error(err);

        return error_response(ERRORS.ERR46.message, 500);
    }
}


function error_response(message: string, status_code: number): ParsedRequestUrlResult
{
    return {
        error: {
            message,
            status_code
        },
        data: null,
    };
}
