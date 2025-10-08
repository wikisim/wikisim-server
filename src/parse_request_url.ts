// TODO, remove all of these dependencies once we can recursively
// clone /lib/core into Deno Deploy

function parse_id(instance: string, _enforce_version?: boolean): IdAndVersion
{
    const [id, version] = instance.includes("v")
        ? instance.split("v")
        : [instance, undefined]

    if (version === undefined)
    {
        throw new Error(`DataComponentId string must include version: ${instance}`)
    }

    const instance_id = new IdAndVersion(id, version)

    return instance_id
}

export class IdAndVersion
{
    static from_str(str: string): IdAndVersion
    {
        return parse_id(str, true)
    }

    id: number
    version: number
    constructor(id: number | string, version: number | string)
    {
        const parsed_id = typeof id === "string" ? parseInt(id, 10) : id
        const parsed_version = typeof version === "string" ? parseInt(version, 10) : version
        if (isNaN(parsed_id))
        {
            throw new Error(`id must be a valid number but got "${id}"`)
        }
        if (isNaN(parsed_version) || parsed_version < 1)
        {
            throw new Error(`version must be a valid number >= 1 but got "${version}"`)
        }
        this.id = parsed_id
        this.version = parsed_version
    }

    // as_IdOnly(): IdOnly
    // {
    //     return new IdOnly(this.id)
    // }

    to_str(): string { return `${this.id}v${this.version}` }

    to_str_without_version(): string { return `${this.id}` }

    // The replacing of - with _ is to allow for negative ids in tests
    to_javascript_str(): string { return "d" + this.to_str().replace("-", "_") }
}

const ERRORS =
{
    ERR46: new Error("ERR46. wikisim-server encountered unexpected error."),
}

function truncate(text: string, max_length: number = 100): string
{
    if (text.length <= max_length) return text;
    return text.slice(0, max_length - 3) + "...";
}

// import { IdAndVersion, parse_id } from "../lib/core/src/data/id.ts";
// import { ERRORS } from "../lib/core/src/errors.ts";
// import { truncate } from "../lib/core/src/utils/truncate.ts";


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
