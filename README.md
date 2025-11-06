
# WikiSim Server

[![Tests](https://github.com/wikisim/wikisim-server/actions/workflows/run_tests.yaml/badge.svg)](https://github.com/wikisim/wikisim-server/actions/workflows/run_tests.yaml)

Serves WikiSim "interactable" sites, which are static HTML/CSS/JS/etc
directories of files.

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
