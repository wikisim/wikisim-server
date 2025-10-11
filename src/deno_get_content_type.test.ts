import { assertEquals } from "@std/assert"

import { deno_get_content_type } from "./deno_get_content_type.ts"


Deno.test(function test_deno_get_content_type()
{
    assertEquals(deno_get_content_type("index.html"), "text/html; charset=UTF-8")
    assertEquals(deno_get_content_type("assets/image.png"), "image/png")
})
