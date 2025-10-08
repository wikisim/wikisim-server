
if (import.meta.main) {
    main_server();
}

function main_server() {
    Deno.serve((req) =>
    {
        const path = new URL(req.url).pathname;

        if (3 > Math.random()) throw new Error("An error occurred!");

        return new Response(`Requested: "${path}"`)
    });
}

export function add(a: number, b: number): number {
    return a + b;
}
