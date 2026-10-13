# Theme compatibility fixture

This manual fixture opens a `@wordpress/ui` tooltip whose popup mounts `ThemeProvider`. It builds the same public consumer against a published UI package and the checkout's built UI package. The normal `@wordpress/scripts` configuration supplies dependency extraction. WordPress loads `wp-theme` and the shared private API runtime through the generated asset dependencies.

Use it with [Testing published packages across WordPress versions](../../../../docs/contributors/code/package-runtime-compatibility.md). It checks the main UI entrypoint and the theme script dependency. It does not establish compatibility for every UI component, other package entrypoints, or every WordPress release.

## Compatibility boundaries

An export fallback protects access to the component, but props and CSS tokens can differ across versions. WordPress 7.0 reads `color.bg`, while UI 0.15.1 and the current UI pass `color.background`. UI 0.15.1 also consumes `--wpds-color-bg-*` and `--wpds-color-fg-*` names, which the current theme replaced with `--wpds-color-background-*` and `--wpds-color-foreground-*`. Generated CSS fallbacks keep the popup readable when its token names are unavailable. These fixed default colors do not translate provider props or reproduce a requested custom theme. Record fallback rendering separately from custom theme application; a light popup alone does not establish a compatibility regression.

## Build the consumers

From the repository root, install and build the checkout as described in the contributor guide. Then install a published UI version in a temporary directory. Version `0.15.1` predates the public `ThemeProvider` migration and exercises its private path. Keep the generated temporary `package-lock.json` with the results so the transitive dependencies can be reproduced.

```sh
theme_consumer=$(mktemp -d)
printf '{"private":true}' > "$theme_consumer/package.json"
npm install --prefix "$theme_consumer" --save-exact --ignore-scripts @wordpress/ui@0.15.1 react@18.3.1 react-dom@18.3.1
npm exec --no --workspace @wordpress/scripts -- webpack --config ../../tools/validation/fixtures/theme-compatibility/webpack.config.cjs --env oldUi="$theme_consumer"
```

The output is `build/old/index.js` and `build/new/index.js` in this directory. Each has its own `index.asset.php`. Confirm both asset files include `wp-theme` and `wp-private-apis`. The UI package must be bundled, while theme and private API locks must come from WordPress. Do not replace these dependencies with mocks or separate bundled copies.

## Run in WordPress

Create two isolated `wp-env` configurations outside the checkout. Use the same core version and separate ports. The first loads this fixture alone. The second also loads the candidate Gutenberg checkout. The following example uses WordPress 7.0, the checkout's minimum supported version. Replace the absolute paths with your paths.

```json
{
	"core": "https://wordpress.org/wordpress-7.0.zip",
	"port": 18997,
	"testsEnvironment": false,
	"plugins": [ "/absolute/path/to/gutenberg/tools/validation/fixtures/theme-compatibility" ],
	"config": { "WP_DEBUG": true, "SCRIPT_DEBUG": true }
}
```

For the second configuration, use port `18998` and add `/absolute/path/to/gutenberg` to `plugins`. Check each environment's status before starting it:

```sh
npm exec --no -- wp-env --config /absolute/path/to/old.wp-env.json status
npm exec --no -- wp-env --config /absolute/path/to/old.wp-env.json start
npm exec --no -- wp-env --config /absolute/path/to/new.wp-env.json status
npm exec --no -- wp-env --config /absolute/path/to/new.wp-env.json start
```

In each environment, sign in and open **Tools → Theme compatibility**. Add `&bundle=old` or `&bundle=new` to the page URL to select the consumer. Focus the trigger with Tab, check the visible popup, and press Escape to dismiss it. Repeat with a pointer. Inspect the popup's computed foreground/background colors, its inherited theme custom properties, and the browser console. Record whether the requested theme was applied or the popup uses default colors, including generated CSS fallbacks. Both can produce a usable popup.

| UI bundle | WordPress theme dependency | Required evidence |
| --- | --- | --- |
| Published | Core | Baseline loading, private API access, theme values, and dismissal. |
| Published | Candidate Gutenberg | Existing private API access, usable rendering with available tokens or CSS fallbacks, and dismissal. |
| Checkout | Core | The compatibility fallback loads, the popup remains usable, and dismissal works. Record custom theme application separately. |
| Checkout | Candidate Gutenberg | The public export loads and the popup consumes the generated theme values. |

Record loading and interactions as `pass`, `fail`, or `unverified`, with the exact core version, Gutenberg revision, UI version, asset dependencies, computed colors, and any console errors. For rendering, record whether the requested theme is applied, default or fallback colors are used, or the result is unverified. Do not classify default colors alone as a regression unless preserving the custom theme is a supported requirement. Add intermediate WordPress versions when their API or tokens differ. Repeat with `SCRIPT_DEBUG` disabled before removing the compatibility bridge.

A scheduled removal version is a review point. Keep `privateApis.ThemeProvider` and the UI fallback until maintained consumers have migrated and the required combinations pass, or document an explicit support change. See the public type derivation example in the [theme README](../../../../packages/theme/README.md#typescript-props-and-warnings) when compiling existing consumers against packed declarations.

Stop the two fixture environments after the check:

```sh
npm exec --no -- wp-env --config /absolute/path/to/old.wp-env.json stop
npm exec --no -- wp-env --config /absolute/path/to/new.wp-env.json stop
```
