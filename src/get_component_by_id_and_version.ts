import { SupabaseClient } from "npm:@supabase/supabase-js@2.44.2"

import { DBDataComponent, ERRORS, IdAndVersion, valid_value_type } from "./core.ts"


type Result =
{
    component: DBDataComponent
    error: null
} | {
    component: null
    error: { message: string, status_code: number }
}

// deno-lint-ignore no-explicit-any
export async function get_component_by_id_and_version(id_and_version: IdAndVersion, supabase: SupabaseClient<any, "public", any>): Promise<Result>
{
    // TODO: replace with request_historical_data_components once we get Deno
    // Deploy recursive git clone working
    const response = await supabase
        .from("data_components_history")
        .select("*")
        .eq("id", id_and_version.id)
        .eq("version_number", id_and_version.version)
        // .eq("value_type", "interactable")

    if (response.error)
    {
        console.error(`Supabase error whilst fetching id "${id_and_version.to_str()}":`, response.error)
        return error_response(ERRORS.ERR46.message, 500)
    }

    const data = response.data
    const raw_component = data[0]
    if (!raw_component) return error_response(`No data for id ${id_and_version.to_str()}`, 404)

    const component: DBDataComponent = {
        id: raw_component.id,
        version_number: raw_component.version_number,
        value_type: raw_component.value_type,
        result_value: raw_component.result_value,
    }

    if (component.value_type !== "interactable")
    {
        const value_type = valid_value_type(component.value_type)
        return error_response(`This component is not a WikiSim interactable but is a ${value_type}`, 404)
    }

    return { component, error: null }
}



function error_response(message: string, status_code: number): Result
{
    return {
        error: {
            message,
            status_code
        },
        component: null,
    }
}
