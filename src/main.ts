
if (import.meta.main) {
    main_server();
}

function main_server() {
    Deno.serve((req) =>
    {
        const path = new URL(req.url).pathname;

        return new Response(`Requested: "${path}"`)
    });
}

export function add(a: number, b: number): number {
    return a + b;
}
