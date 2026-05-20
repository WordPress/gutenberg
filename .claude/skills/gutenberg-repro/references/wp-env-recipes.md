# wp-env recipes

Copy-paste WP-CLI invocations for applying common preconditions before opening the browser. All examples assume the current working directory is the Gutenberg checkout and that `npm run wp-env start -- --runtime=playground` has already completed.

The general shape:

```bash
npm run wp-env run cli wp <wp-cli-command>
```

> **Runtime note.** The `npm run wp-env run cli wp …` commands below require the Docker runtime. Under the Playground runtime (`npm run wp-env start -- --runtime=playground`) the `run` subcommand is unsupported — `wp-env` will print `✖ The 'run' command is not supported in the Playground runtime at the moment.` See "Playground fallbacks" at the bottom of this file.

Log every command executed in the report's "Preconditions applied" section, along with an excerpt of its output.

## Default credentials

- Admin user: `admin`
- Admin password: `password`
- Site URL: `http://localhost:8888`
- Admin URL: `http://localhost:8888/wp-admin/`

## Posts and content

### Create a draft post with raw HTML/block content

```bash
npm run wp-env run cli wp post create \
  --post_type=post \
  --post_status=draft \
  --post_title='Repro: <issue-number>' \
  --post_content='<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->' \
  --porcelain
```

The `--porcelain` flag prints just the new post ID. Capture it and use it to build the editor URL:

```
http://localhost:8888/wp-admin/post.php?post=<ID>&action=edit
```

### Create a post containing a specific block

```bash
npm run wp-env run cli wp post create \
  --post_type=post \
  --post_status=draft \
  --post_title='Repro' \
  --post_content='<!-- wp:cover {"url":"http://localhost:8888/wp-content/uploads/2024/01/sample.jpg"} -->
<div class="wp-block-cover"><img class="wp-block-cover__image-background" alt="" src="http://localhost:8888/wp-content/uploads/2024/01/sample.jpg" data-object-fit="cover"/><div class="wp-block-cover__inner-container"><!-- wp:paragraph --><p>Cover text</p><!-- /wp:paragraph --></div></div>
<!-- /wp:cover -->' \
  --porcelain
```

### Delete all posts (sometimes needed to start clean)

Do **not** run this unless the user has explicitly confirmed — it is destructive to local content.

```bash
# DO NOT run without user consent
npm run wp-env run cli wp post delete $(npm run wp-env run cli wp post list --post_type=post --format=ids) --force
```

## Themes

### List installed themes

```bash
npm run wp-env run cli wp theme list
```

### Switch active theme

```bash
npm run wp-env run cli wp theme activate twentytwentyfive
```

If the requested theme isn't installed:

```bash
npm run wp-env run cli wp theme install twentytwentyfive --activate
```

## Plugins

### List active plugins

```bash
npm run wp-env run cli wp plugin list --status=active
```

### Activate / deactivate a plugin

```bash
npm run wp-env run cli wp plugin activate gutenberg
npm run wp-env run cli wp plugin deactivate gutenberg
```

The Gutenberg plugin is normally already active in the dev wp-env. The skill should not deactivate it unless the issue explicitly tests classic-editor behavior.

## Users and roles

### Create a user with a specific role

```bash
npm run wp-env run cli wp user create author1 author1@example.com \
  --role=author \
  --user_pass=password \
  --porcelain
```

### Change role of existing user

```bash
npm run wp-env run cli wp user set-role <login> editor
```

To log in as a non-admin user, the Playwright login step needs the matching credentials — pass them through the plan, do not hardcode `admin`/`password` for non-admin scenarios.

## Site options

### Set a single option

```bash
npm run wp-env run cli wp option update <option_name> '<value>'
```

### Toggle a Gutenberg experiment

Experiments are stored in the `gutenberg-experiments` option:

```bash
npm run wp-env run cli wp option get gutenberg-experiments --format=json
npm run wp-env run cli wp option update gutenberg-experiments '{"gutenberg-block-bindings-ui":true}' --format=json
```

Toggling experiments can change the editor UI substantially. Always note the experiment state in the report.

## Patterns and templates

### Import a block pattern as a post

The simplest path is creating a post with the pattern's serialized block markup (see "Create a post with a specific block" above). For complex patterns, consider attaching the markup to a file and:

```bash
npm run wp-env run cli wp post create --post_type=post --post_content="$(cat /tmp/pattern.html)" --porcelain
```

## REST endpoints

For backend reproductions where the bug is in the REST API itself, `curl` the endpoint directly (still through wp-env's proxy). Use HTTP basic auth with an application password if needed, but per the SKILL's rigid rules the skill does not auto-mint app passwords — if the issue requires REST testing, log this as a limitation in the report's Notes section.

## Useful inspection commands

```bash
# Health check
npm run wp-env run cli wp core version
npm run wp-env run cli wp plugin list
npm run wp-env run cli wp theme list

# Look at recent error log entries (debug.log)
npm run wp-env run cli wp config get WP_DEBUG_LOG
```

Run these at the end of preconditions setup to confirm the env is in the expected shape; capture relevant output in the execution log.

## Playground fallbacks

Under the Playground runtime, apply preconditions via wp-admin UI instead of WP-CLI. These flows are slower and less reliable than CLI, so prefer the Docker runtime when CLI is available.

### Install a plugin from a local zip

*Requires user consent — see SKILL.md Step 6.*

1. Navigate to `http://localhost:8888/wp-admin/plugin-install.php?tab=upload`.
2. Click the "Plugin zip file" button (opens the OS file chooser via Playwright).
3. Call `browser_file_upload` with a path. Playwright MCP only accepts paths inside the project root or `.playwright-mcp/`; it rejects `/tmp/...`. Because staging files inside the checkout requires user consent, surface this trade-off to the user before proceeding.
4. Click "Install Now".
5. Click "Activate Plugin" on the success screen.

### Toggle a setting via the Settings screens

Navigate to `/wp-admin/options-general.php` (or the specific Settings sub-screen) and submit the form via Playwright. This works for everything exposed in `/wp-admin/options-*.php`.

### Create / edit a post

Use the editor itself and save via the UI — this is one of the few CLI-style flows with a clean UI alternative.

### When no UI fallback exists

If a precondition requires anything more invasive than the above (e.g., setting `gutenberg-experiments`, deleting user meta, switching to a theme that isn't installed), stop and tell the user the Playground runtime cannot apply it; suggest re-running under the Docker runtime.
