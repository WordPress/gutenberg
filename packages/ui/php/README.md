# Server-rendered components (experimental)

Lets PHP-rendered admin screens use `@wordpress/ui` components, as explored in [#84036](https://github.com/WordPress/gutenberg/issues/84036). The PHP markup isn't written by hand: the build renders the React components and PHP fills in the result, so there is one implementation to maintain. It runs behind the `gutenberg-ui-php-components` experiment, with a preview page under Tools → UI Components.

```php
echo gutenberg_get_ui_component( 'button', array( 'label' => __( 'Save' ), 'type' => 'submit' ) );
```

This first step covers Button only.

## How it works

Each component has a folder here with a `component.json`:

-   `props` is the PHP contract, a JSON schema per prop. Props with a fixed set of values (an `enum` or a boolean) are variants. Free-form strings are slots.
-   `render` maps the props to the React element, as `[ type, props, ...children ]`, where `"$name"` is a prop. A boolean prop that is `false` is left out of the element, as a React caller would leave it out, so the component's own defaults apply, as they would for a React caller.
-   `example` gives the props for the preview page and the checks.
-   `deprecations` (optional) keeps renamed props and values working. See [Versioning](#versioning-and-backward-compatibility).

`bin/build-php.mjs` runs after the package build. It renders the React element for every combination of variants, with placeholders for the slots, and stores each render as a snapshot in `build-php/manifest.php`. PHP picks the snapshot for the props it gets, then escapes and fills in the slots. Strings React translates with `__()`, such as a "Dismiss" label, are caught through the `i18n.gettext` filter while rendering snapshots, and PHP translates them with `translate()` in the same text domain. `_x()` and `_n()` aren't supported yet; the build fails if their text reaches the markup. The stylesheet is compiled by `@wordpress/build` from the same CSS modules React uses, so class names match.

This works for components whose props have a fixed set of values or are plain text, which covers most static components.

## What PHP components support

A PHP component is a subset of the React one: markup and CSS only, with no JavaScript. A prop is only exposed when the snapshot alone gets its behavior right, and a check covers that behavior.

-   **Text** props are plain text, escaped with `esc_html()`. They can't contain markup.
-   **Attribute** props are escaped with `esc_attr()`, or `esc_url()` for URLs.
-   **No other content.** A component takes no children beyond what its props declare.

For Button:

-   `disabled` renders the native `disabled` attribute, so the browser blocks activation without JavaScript. That's why the mapping sets `focusableWhenDisabled` to `false`. React's default keeps a disabled button focusable and blocks activation with Base UI's JavaScript, which a snapshot can't carry. The end-to-end test checks that a disabled PHP button can't be focused or activated.
-   `loading` isn't supported. React announces it with `speak()` from an effect, and a loading state only happens after the user acts, which needs JavaScript. It comes back with the behavior work below.

## Keeping up with React

React changes far more often than PHP callers can adapt, so every kind of change is either picked up automatically or stops the build or the tests:

| React change | What happens |
| --- | --- |
| CSS changes | `style.css` is regenerated. Nothing to do. `test/e2e/specs/admin/ui-components-php.spec.js` screenshots each example rendered by PHP with the PHP stylesheet, and as React's markup with all of the package's styles, and compares them pixel by pixel. |
| Markup or class changes | Snapshots are regenerated. `php/<name>/snapshot.html` is out of date, the build warns and the PHPUnit check fails until it's updated with `npm run update-php-snapshots --workspace @wordpress/ui`. The diff shows reviewers the PHP impact. |
| A prop or value is renamed or removed | The build fails: the variant no longer changes the markup. |
| A component is renamed or removed | The build fails: the `render` mapping points at a missing export. |
| A new prop or value | Not exposed to PHP until it's added to `component.json`, on purpose. |

## Versioning and backward compatibility

React components can change freely; PHP callers in core and plugins can't. The contract between them is only the component name and its `props`. Markup and class names change with every build and aren't part of it.

-   Each component's `contract.lock.json` records its props as of the last release, and a fingerprint of its markup. The build fails if a prop or value is removed, a type changes or a prop becomes required, unless `deprecations` keeps the old one working. Release tooling would update the lock with `npm run update-php-contracts --workspace @wordpress/ui`.
-   Markup can't be frozen, because it's generated together with the CSS that depends on it. Instead, the build lists the components whose markup changed since the last release, for the release notes and developer notes, so plugin authors who style or query it know in advance.
-   A deprecation maps an old prop or value to its replacement, with a `_deprecated_argument()` notice: `{ "prop": "text", "replacement": "label", "since": "0.26.0" }` or `{ "prop": "variant", "value": "secondary", "replacement": "outline", "since": "0.26.0" }`.
-   Class names are hashes of the file path and class name, the same in React and PHP. They stay the same across releases, but they aren't part of the contract. Snapshots write classes as `button/style:is-brand`, so they'd survive a change to how hashes are made, such as changing them with every release.

Open questions:

-   Version skew. A plugin that needs a newer version than core's can bundle `build-php/` from the npm package and create its own renderer with its own handle prefix (`new Gutenberg_UI_Components( $dir, $url, 'my-plugin-ui-' )`), so its stylesheet loads next to core's. It would still need to prefix the class name (with a tool like Strauss).
-   Whether removing a deprecated prop is ever allowed, or deprecations stay forever.
-   Which version a deprecation's `since` names. The `@wordpress/ui` version is easy to record, but WordPress notices name WordPress versions, so core would translate it when syncing.

## Bringing it to WordPress core

Core would consume the build output, not this folder, the way it consumes the icons manifest. Each change would be its own Trac ticket:

1. **Ship the components.** Sync `build-php/` from the `@wordpress/ui` npm package into `wp-includes/`, add a class that loads it (as `WP_Icons_Registry` loads the icons manifest) and a `wp_get_ui_component( $name, $props )` function, and register the `wp-ui-components` style in `script-loader.php`. Start with core's own screens only, before making it a public API.
2. **Declare the admin's cascade layer order.** One `@layer` statement loaded first in wp-admin, so the design system's layers and core's layered styles always stack the same way regardless of load order.

## Next steps

-   **Collapsible behavior.** CollapsibleCard: the build renders it closed and open and records which attributes change, and one generic script applies them on toggle. This shows state derived from React renders, without a second implementation of the behavior.
-   **Shared interaction tests.** Run the same Playwright scenarios against the React component and its PHP version, written with roles and names rather than markup.
-   **Announcements.** Button's `loading` prop needs the `speak()` announcement React makes from an effect. Bring it back once there's a way to run that behavior on PHP screens.
-   **Accessibility tree parity.** Add an `aria-snapshot` comparison of the PHP and React renders next to the pixel comparison.
-   **Layering against legacy admin CSS.** `lib/experimental/wpds-admin/` already moves core's stylesheets into `@layer wp-legacy`. Check whether the components should rely on that on classic screens.
-   **Interactivity API.** Decide between small custom elements and Interactivity API stores for behavior, and measure what loading `@wordpress/interactivity` costs on a classic screen.
-   **More components and coverage.** Count how many components in `packages/ui/src` this approach renders cleanly. Compound components, icons and generated IDs (for example `aria-controls`) come with the components that need them.
