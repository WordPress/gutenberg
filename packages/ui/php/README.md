# Server-rendered components (experimental)

Lets PHP-rendered admin screens use `@wordpress/ui` components, as explored in [#84036](https://github.com/WordPress/gutenberg/issues/84036). The PHP markup isn't written by hand: the build renders the React components and PHP fills in the result, so there is one implementation to maintain. It runs behind the `gutenberg-ui-php-components` experiment.

```php
echo gutenberg_get_ui_component( 'button', array( 'label' => __( 'Save' ), 'type' => 'submit' ) );
```

This first step covers Button only.

## How it works

Each component has a folder here with a `component.json`:

-   `props` is the PHP contract, a JSON schema per prop. Props with a fixed set of values (an `enum` or a boolean) are variants. Free-form strings are slots.
-   `render` maps the props to the React element, as `[ type, props, ...children ]`, where `"$name"` is a prop.
-   `example` gives the props for the checks.

`bin/build-php.mjs` runs after the package build. It renders the React element for every combination of variants, with placeholders for the slots, and stores each render as a snapshot in `build-php/manifest.php`. PHP picks the snapshot for the props it gets, then escapes and fills in the slots. Strings React translates with `__()`, such as Button's "Loading" label, are caught through the `i18n.gettext` filter while rendering snapshots, and PHP translates them with `translate()` in the same text domain. `_x()` and `_n()` aren't supported yet; the build fails if their text reaches the markup. The stylesheet is compiled by `@wordpress/build` from the same CSS modules React uses, so class names match.

This works for components whose props have a fixed set of values or are plain text, which covers most static components.

## Keeping up with React

React changes far more often than PHP callers can adapt, so every kind of change is either picked up automatically or stops the build or the tests:

| React change | What happens |
| --- | --- |
| CSS changes | `style.css` is regenerated. Nothing to do. |
| Markup or class changes | Snapshots are regenerated. `php/<name>/snapshot.html` is out of date, the build warns and the PHPUnit check fails until it's updated with `npm run update-php-snapshots --workspace @wordpress/ui`. The diff shows reviewers the PHP impact. |
| A prop or value is renamed or removed | The build fails: the variant no longer changes the markup. |
| A component is renamed or removed | The build fails: the `render` mapping points at a missing export. |
| A new prop or value | Not exposed to PHP until it's added to `component.json`, on purpose. |

## Bringing it to WordPress core

Core would consume the build output, not this folder, the way it consumes the icons manifest. Each change would be its own Trac ticket:

1. **Ship the components.** Sync `build-php/` from the `@wordpress/ui` npm package into `wp-includes/`, add a class that loads it (as `WP_Icons_Registry` loads the icons manifest) and a `wp_get_ui_component( $name, $props )` function, and register the `wp-ui-components` style in `script-loader.php`. Start with core's own screens only, before making it a public API.
2. **Declare the admin's cascade layer order.** One `@layer` statement loaded first in wp-admin, so the design system's layers and core's layered styles always stack the same way regardless of load order.

## Next steps

-   **Collapsible behavior.** CollapsibleCard: the build renders it closed and open and records which attributes change, and one generic script applies them on toggle. This shows state derived from React renders, without a second implementation of the behavior.
-   **Shared interaction tests.** Run the same Playwright scenarios against the React component and its PHP version, written with roles and names rather than markup.
-   **Announcements.** Button (loading) calls `speak()` from `@wordpress/a11y` in React. The PHP version announces nothing, and no check catches it.
-   **Accessibility tree parity.** Add an `aria-snapshot` comparison of the PHP and React renders next to the pixel comparison.
-   **Layering against legacy admin CSS.** `lib/experimental/wpds-admin/` already moves core's stylesheets into `@layer wp-legacy`. Check whether the components should rely on that on classic screens.
-   **Interactivity API.** Decide between small custom elements and Interactivity API stores for behavior, and measure what loading `@wordpress/interactivity` costs on a classic screen.
-   **More components and coverage.** Count how many components in `packages/ui/src` this approach renders cleanly. Compound components, icons and generated IDs (for example `aria-controls`) come with the components that need them.
