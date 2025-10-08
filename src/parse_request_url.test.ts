import { assertEquals } from "@std/assert";
import { IdAndVersion } from "../lib/core/src/data/id.ts";
import { parse_request_url } from "./parse_request_url.ts";


Deno.test(function test_parse_request_url()
{
    assertEquals(parse_request_url("https://wikisim-server.wikisim.deno.net/1234v5"), {
        error: null,
        data: {
            id_and_version: new IdAndVersion(1234, 5),
            file_path: "index.html"
        }
    });

    assertEquals(parse_request_url("https://wikisim-server.wikisim.deno.net/1234v5/script.js"), {
        error: null,
        data: {
            id_and_version: new IdAndVersion(1234, 5),
            file_path: "script.js"
        }
    });

    assertEquals(parse_request_url("https://wikisim-server.wikisim.deno.net/-1234v5/assets/b/image.png"), {
        error: null,
        data: {
            id_and_version: new IdAndVersion(-1234, 5),
            file_path: "assets/b/image.png"
        }
    });
});
