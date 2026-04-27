
# WikiSim Server

[![Tests](https://github.com/wikisim/wikisim-server/actions/workflows/run_tests.yaml/badge.svg)](https://github.com/wikisim/wikisim-server/actions/workflows/run_tests.yaml)

Serves WikiSim "interactable" sites, which are static HTML/CSS/JS/etc
directories of files.

## Implementation

When a component with type "interactable" has its files uploaded by the wikisim-supabase
edge function it [is stored in a Supabase storage bucket](github.com/wikisim/wikisim-supabase/blob/799232c/supabase/functions/ef_upload_interactable_files/index.ts#L64).  And
the file ids are saved on the component's result_value field like:

    {
        "index.html":"f8b070e9-a7a3-4b89-91f6-ed60d968da2b",
        "svgs/bluesky.svg":"04439b4c-7a4d-4aa9-9f5e-a08c184e6e66",
        "assets/index-BbATOUI6.js":"04eac4cc-c74c-44bf-acf3-70484ed0f2e0",
        ...
    }

When the interactable component is loaded for the user by the frontend server, this
currently involves [making an iframe with the URL](https://github.com/wikisim/wikisim-frontend/blob/d814bba/src/ui_components/data_component/PlayInteractable.tsx#L31) like: https://wikisim-server.wikisim.deno.net/1272v11/

## Future work - reliability

One user reported the [deno server timed out](https://github.com/wikisim/wikisim-server/issues/3).
For now we are running a manual script to monitor the deno server's uptime and response time.

## Dev

    git clone --recursive git@github.com:wikisim/wikisim-server.git

### Install the deno CLI

Suggest installing Denoland extension for Deno support in VS Code: https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno
Which also needs the deno CLI: https://deno.land/manual/getting_started/installation
Deno, should already be enabled for this workspace (via .vscode/settings.json)

### Local dev problems

May need to store dependencies manually in the deno cache with:
```bash
deno cache https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts
deno cache npm:mime-types@3.0.1
```
And to update the deno.lock file:
```bash
deno cache --lock=deno.lock --reload main.ts
```

### Run tests

    deno test

### Pre-push Hook

If you want to ensure your tests and linting pass before pushing, you can set up a pre-push hook:
```bash
ln -s $(pwd)/scripts/pre-push.sh .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

### Deployment and hosting

Push code to GitHub.  https://console.deno.com/wikisim will auto-deploy from the `main` branch.

* Need to add the SENTRY_DSN environment variable to the Deno Deploy project for
    error monitoring with Sentry. -- have not yet confirmed this is working as of 2026-04-27 when it was added
