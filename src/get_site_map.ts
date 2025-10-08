import { ERRORS } from "./core.ts"


type Result = {
    map: Map<string, string>
    error: null
} | {
    map: null
    error: { message: string, status_code: number }
}

export function get_site_map(result_value: string | null, id_str: string): Result
{
    if (!result_value) return error_response("No result value", 404)

    try
    {
        const obj = JSON.parse(result_value)
        if (typeof obj !== "object" || obj === null)
        {
            console.error(`Result value is not an object for component id "${id_str}"`)
            return error_response("Result value is not an object", 500)
        }

        const map = new Map<string, string>()
        for (const [key, value] of Object.entries(obj))
        {
            if (typeof key !== "string" || typeof value !== "string")
            {
                console.error(`Result value has non-string key or value for component id "${id_str}"`)
                return error_response("Result value has non-string key or value", 500)
            }
            map.set(key, value)
        }

        return { map, error: null }
    }
    catch (e)
    {
        console.error(`Error parsing result value for component id "${id_str}":`, e)
        return error_response(ERRORS.ERR46.message, 500)
    }
}


function error_response(message: string, status_code: number): Result
{
    return {
        error: {
            message,
            status_code
        },
        map: null,
    }
}
