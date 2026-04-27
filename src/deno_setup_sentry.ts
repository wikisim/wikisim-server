// Shared between wikisim-supabase/supabase/functions/_shared/deno_setup_sentry.ts
// and wikisim-server/src/deno_setup_sentry.ts

// deno-lint-ignore no-import-prefix
import { SupabaseClient } from "jsr:@supabase/supabase-js@2.44.2"
// deno-lint-ignore no-import-prefix
import { supabaseIntegration } from "npm:@supabase/sentry-js-integration@0.3"
// deno-lint-ignore no-import-prefix
import * as Sentry from "npm:@sentry/deno@10.49.0"


export const original_console = {
    error: console.error,
    warn: console.warn,
    info: console.info,
}

export function setup_sentry(server_name: string): void
{
    const sentry_dsn = Deno.env.get("SENTRY_DSN")
    if (sentry_dsn)
    {
        Sentry.init({
            dsn: sentry_dsn,
            // Adds request headers and IP for users, for more info visit:
            // https://docs.sentry.io/platforms/javascript/guides/deno/configuration/options/#sendDefaultPii
            sendDefaultPii: true,
            serverName: server_name,

            integrations: [
                supabaseIntegration(SupabaseClient, Sentry, {
                    tracing: true,
                    breadcrumbs: true,
                    errors: true,
                }),
            ],
        })


        console.error = function (...args)
        {
            if (args[0] instanceof Error) Sentry.captureException(args[0])
            else Sentry.captureMessage(args.map(error_to_string).join(" "), "error")

            // Log to the console
            original_console.error.apply(console, args)
        }

        console.warn = function (...args)
        {
            Sentry.captureMessage(args.map(error_to_string).join(" "), "warning")

            // Log to the console
            original_console.warn.apply(console, args)
        }

        console.info = function (...args)
        {
            Sentry.captureMessage(args.map(error_to_string).join(" "), "info")

            // Log to the console
            original_console.info.apply(console, args)
        }


        console.log("Sentry initialized for", server_name)
    }
    else
    {
        console.warn("SENTRY_DSN not set in env, Sentry will not be initialized")
    }
}



// Copied from "../_core/src/error_to_string.ts" but without dependency on PostgrestError.
function error_to_string(value: unknown): string
{
    if (typeof value === "string") return value
    // if (value instanceof PostgrestError) return `PostgrestError ${value.code} - ${value.name}, message: ${value.message}, details: ${value.details}, hint: ${value.hint}, stack: ${value.stack}`

    let json_string = ""
    try
    {
        json_string = JSON.stringify(value)
        json_string = json_string === "{}" ? "" : (", JSON: " + json_string)
    }
    catch {
        // pass
    }

    if (value instanceof Error) return "Message: " + value.message + json_string + ", Stack: " + value.stack

    return String(value) + json_string
}
