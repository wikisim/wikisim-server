
if (import.meta.main) {
    main_server();
}

function main_server() {
    Deno.serve((_req) => new Response("Hello world"));
}

export function add(a: number, b: number): number {
    return a + b;
}
