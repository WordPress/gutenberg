# Server-rendered components (experimental)

Lets PHP-rendered admin screens use `@wordpress/ui` components, as explored in [#84036](https://github.com/WordPress/gutenberg/issues/84036). The PHP markup isn't written by hand: the build renders the React components and PHP fills in the result, so there is one implementation to maintain. It runs behind the `gutenberg-ui-php-components` experiment, with a preview page under Tools → UI Components.

```php
echo gutenberg_get_ui_component( 'button', array( 'label' => __( 'Save' ), 'type' => 'submit' ) );
```

## How it works

Each component has a folder here with a `component.json`:

-   `props`: a JSON schema per prop. Props with a fixed set of values (an `enum` or a boolean) are variants; free-form strings are filled in by PHP.
-   `render`: the React element to render, as `[ type, props, ...children ]`, where `"$name"` is a prop.
-   `example`: the props for the preview page and the checks.

`bin/build-php.mjs` runs after the package build. It renders the React element for every combination of variants and writes the result to `build-php/manifest.php`, which is generated and never committed. PHP picks the markup for the props it gets, then escapes and fills in the free-form ones. The stylesheet is compiled by `@wordpress/build` from the same CSS modules React uses, so class names match.

## What PHP components support

A PHP component is a subset of the React one: markup and CSS only, with no JavaScript. A prop is only exposed when the markup alone gets its behavior right.

-   Props are plain text, escaped as React escapes them, so entities show as written (`&hellip;` stays `&hellip;`). Decode already-encoded strings, such as `get_the_title()`, first. URLs are escaped with `esc_url()`.
-   Button's `disabled` renders the native `disabled` attribute, so the browser blocks activation without JavaScript. React keeps a disabled button focusable and blocks it with Base UI's JavaScript, which static markup can't carry.
-   Button's `loading` isn't supported: React announces it with `speak()` from an effect, which needs JavaScript.

## Keeping up with React

| React change | What happens |
| --- | --- |
| CSS | `style.css` is regenerated. An end-to-end test compares PHP and React screenshots of each example. |
| Markup or classes | `php/<name>/snapshot.html` is out of date, and PHPUnit fails until it's updated with `npm run update-php-snapshots --workspace @wordpress/ui`. The diff shows reviewers the PHP impact. |
| A prop, value or component is renamed or removed | The build fails. |
| A new prop or value | Not exposed to PHP until it's added to `component.json`, on purpose. |

## Follow-ups

Kept out of this first step, as discussed in [#84036](https://github.com/WordPress/gutenberg/issues/84036):

-   A props contract and deprecations, so PHP calls keep working when React props change.
-   Translations, for components with built-in strings such as Notice's "Dismiss".
-   Content and composition, starting with Card.
-   Interactive components.
