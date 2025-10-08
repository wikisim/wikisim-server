// import { IdAndVersion, parse_id } from "../lib/core/src/data/id.ts";
// import { ERRORS } from "../lib/core/src/errors.ts";
// import { truncate } from "../lib/core/src/utils/truncate.ts";
// import { supabase_url, supabase_anon_key } from "../lib/core/src/supabase/constants.ts"
// import { valid_value_type } from "../lib/core/src/data/field_values_with_defaults.ts"

// TODO, remove all of these dependencies once we can recursively
// clone /lib/core into Deno Deploy

export function parse_id(instance: string, _enforce_version?: boolean): IdAndVersion
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

export const ERRORS =
{
    ERR46: new Error("ERR46. wikisim-server encountered unexpected error."),
}

export function truncate(text: string, max_length: number = 100): string
{
    if (text.length <= max_length) return text;
    return text.slice(0, max_length - 3) + "...";
}

export const supabase_url = "https://sfkgqscbwofiphfxhnxg.supabase.co"
export const supabase_anon_key = "sb_publishable_XWsGRSpmju8qjodw4gIU8A_O_mHUR1H"
export const INTERACTABLES_FILES_BUCKET = "interactables_files"
export const INTERACTABLE_FILE_SIGNED_URL_EXPIRY_SECONDS = 60 * 60 // 1 hour


export type ValueType =
    | "number"
    | "datetime_range"
    | "number_array"
    | "function"
    | "interactable"

export const VALUE_TYPES: ValueType[] = [
    "number",
    "datetime_range",
    "number_array",
    "function",
    "interactable"
]

export const DEFAULTS = {
    value_type: "number" as ValueType,
    value_number_display_type: "bare",
    value_number_sig_figs: 2,
}

export function valid_value_type(value_type: string | null | undefined): ValueType
{
    if (!value_type) return DEFAULTS.value_type
    if (!(VALUE_TYPES.includes(value_type as ValueType))) return DEFAULTS.value_type
    return value_type as ValueType
}

export interface DBDataComponent
{
    id: number
    version_number: number
    value_type: ValueType | undefined
    result_value: string | null
}
