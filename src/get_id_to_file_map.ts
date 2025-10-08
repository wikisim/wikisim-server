import { IdAndVersion } from "./parse_request_url.ts"


type GetIdToFileMapResult =
{
    map: Map<string, string>
    error: null
} | {
    map: null
    error: { message: string, status_code: number }
}
export async function get_id_to_file_map(id_and_version: IdAndVersion): Promise<GetIdToFileMapResult>
{
    await sleep(10);

    if (id_and_version.id === 1234 && id_and_version.version === 5)
    {
        const map = new Map<string, string>();
        map.set("index.html", "123456789");
        map.set("script.js", "98765432");
        return { map, error: null };
    }
    else
    {
        return { map: null, error: { message: `No data for id ${id_and_version.to_str()}`, status_code: 404 } };
    }
}


function sleep(ms: number): Promise<void>
{
    return new Promise((resolve) => setTimeout(resolve, ms));
}
