# Client-Side Navigation Compatibility

Client-side navigation (CSN) enables page transitions without a full page reload by updating only the parts of the page that change. For this to work correctly, **every block on the page must be compatible with client-side navigation**. If a single block on the page is not compatible, the Interactivity API will fall back to a full page reload for that navigation, losing all the performance and UX benefits.

This guide explains what to consider when evaluating compatibility. While the examples focus on blocks, the same principles apply to any code that outputs markup on the front end — including classic PHP themes and plugins.

## Declaring compatibility in `block.json`

Blocks declare CSN compatibility through the `supports.interactivity.clientNavigation` property in `block.json`:

```json
{
	"supports": {
		"interactivity": {
			"clientNavigation": true
		}
	}
}
```

Set `clientNavigation` to `true` to indicate that the block works correctly during client-side navigation. If not declared, it defaults to `false`, meaning the block is considered incompatible.

If the block also uses the Interactivity API directives, declare both properties:

```json
{
	"supports": {
		"interactivity": {
			"clientNavigation": true,
			"interactive": true
		}
	}
}
```

Setting `supports.interactivity` to `true` is a shorthand equivalent to setting both `clientNavigation` and `interactive` to `true`:

```json
{
	"supports": {
		"interactivity": true
	}
}
```

<div class="callout callout-info">

Even if a block appears to work fine with CSN, the compatibility must always be explicitly declared in `block.json`. The Interactivity API checks this property for every block on the page to decide whether client-side navigation can be used.

</div>

## What makes a block compatible

### Non-interactive blocks

Blocks that render HTML without any client-side interactivity — no JavaScript, no event listeners, no dynamic behavior — are generally compatible with CSN. Since they don't rely on scripts to function, client-side navigation can safely replace their HTML without breaking anything.

However, compatibility must still be declared explicitly in `block.json`. The Interactivity API cannot infer compatibility on its own.

### Interactive blocks using the Interactivity API

Blocks that use the Interactivity API for their client-side behavior are designed to work with CSN. The Interactivity API manages DOM updates through a virtual DOM diffing algorithm, ensuring that interactive state is preserved across navigations.

That said, interactive blocks must follow certain practices to remain compatible. See [Ensuring compatibility](#ensuring-compatibility) for details.

### Interactive blocks using other libraries

Blocks that use vanilla JavaScript, jQuery, or any framework other than the Interactivity API for client-side behavior are **not compatible** with CSN. Set `clientNavigation` to `false` (or omit it) for these blocks.

These blocks typically rely on scripts that run once on page load to initialize behavior — attaching event listeners, manipulating the DOM, or setting up widgets. During client-side navigation, the HTML may be replaced, but those initialization scripts won't run again, leaving the block non-functional.

## Ensuring compatibility

Even code built with the Interactivity API needs to follow certain guidelines to work correctly with CSN. The sections below are organized by the type of issue: CSS, JavaScript, and HTML.

### CSS

#### Do not inject CSS dynamically

Blocks that inject `<style>` elements through JavaScript at runtime are not compatible with CSN. The Interactivity API manages stylesheets during navigation by tracking the `<link>` and `<style>` elements that the server includes in the page's `<head>`. Styles created dynamically by client-side code fall outside this system and may be lost or disabled during navigation.

If a block needs conditional styles, use server-side logic to include the appropriate stylesheets when the block is rendered. For example, use [`wp_enqueue_block_support_styles()`](https://developer.wordpress.org/reference/functions/wp_enqueue_block_support_styles/) or conditionally enqueue a stylesheet in your block's `render_callback`.

#### Do not modify existing stylesheets using JavaScript

Programmatically modifying CSS rules at runtime — for example, using the [CSSOM](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model) APIs like `CSSStyleSheet.insertRule()`, `CSSStyleSheet.deleteRule()`, or modifying `CSSStyleDeclaration` objects directly — is not compatible with CSN. These changes are not tracked by the Interactivity API and will be lost when the page's stylesheets are reconciled during navigation.

Instead, use server-side logic to produce the correct stylesheets, or toggle CSS classes on elements using Interactivity API directives like `data-wp-class`.

#### Use stable CSS selectors

CSS selectors (class names, IDs, etc.) must be **stable across navigations**. If a selector changes between page loads, styles may break or apply to the wrong elements after a client-side navigation.

This is especially important for elements **outside router regions**. Since those elements are not replaced during navigation, the incoming page's stylesheets must continue to match them. If both pages share the same template this is usually the case, but mismatches can occur when different templates produce different wrapper elements or class names for the same structural areas.

CSS selectors applied to elements **inside router regions** must also be stable. Since regions are replaced during navigation, the incoming HTML must use the same selectors so that existing stylesheets continue to apply correctly.

A common source of unstable selectors is [`wp_unique_id()`](https://developer.wordpress.org/reference/functions/wp_unique_id/). This function generates sequential IDs (`id-1`, `id-2`, etc.) based on a global counter that resets on each page load. When navigating between two pages, the same block may receive a different ID on each page, causing the CSS selector to no longer match the element.

Instead, use [`wp_unique_id_from_values()`](https://developer.wordpress.org/reference/functions/wp_unique_id_from_values/) (available since WordPress 6.8). This function generates a deterministic hash-based identifier from an array of values, producing the same ID for the same inputs regardless of rendering order:

```php
// Avoid: Sequential IDs change between pages.
$id = wp_unique_id( 'my-block-' );

// Preferred: Hash-based IDs are stable across navigations.
$id = wp_unique_id_from_values(
	array( $block->parsed_block['attrs'] ),
	'my-block-'
);
```

This applies to any selector used in CSS — class names, IDs, or `data-*` attributes used in stylesheets.

### JavaScript

#### Use script modules, not regular scripts

Client-side navigation only supports [script modules](https://make.wordpress.org/core/2024/03/04/script-modules-in-6-5/) (`<script type="module">`). Regular scripts (`<script>` tags without `type="module"`) that run on page load will **not** be re-executed when a page is visited through client-side navigation.

Additionally, only **external** script modules (those with a `src` attribute) are processed during client-side navigation. Inline script modules — where the code is written directly inside the `<script>` tag — are not re-executed during navigation.

Script modules that should be loaded during client-side navigation must be registered with the appropriate dependency declaration so that WordPress includes the `loadOnClientNavigation` flag. For blocks, this happens automatically when the script module is declared in `block.json` and `supports.interactivity.clientNavigation` is set to `true`.

For script modules that don't belong to a block — for example, those enqueued by a classic PHP theme or a plugin — you need to mark them manually by passing `loadOnClientNavigation: true` when registering the module with [`wp_register_script_module()`](https://developer.wordpress.org/reference/functions/wp_register_script_module/).

For more details on how script modules are handled during navigation, see the [Script module handling](/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md#script-module-handling) section of the Client-Side Navigation guide.

### HTML

#### Keep consistent HTML structures

The Interactivity API uses Preact under the hood for virtual DOM diffing. When navigating between pages, Preact compares the current and incoming HTML to calculate the minimum set of DOM changes. Inconsistencies between the two can cause elements to be remounted instead of updated — which may result in lost state — or cause different elements to be treated as the same node, breaking internal state or preventing lifecycle callbacks (like `data-wp-init` or `data-wp-watch`) from re-executing when they should.

Common issues include:

-   **Different element structures**: If the same block renders a `<div>` on one page and a `<section>` on another, Preact treats them as entirely different elements and replaces the node, losing any state associated with it.
-   **Elements gaining or losing directives**: If an element has no Interactivity API directives on one page but gains `data-wp-bind` or similar on another, the diffing may not reconcile them correctly.
-   **Dynamic siblings**: When elements appear or disappear between pages (for example, conditional content), Preact may struggle to match the remaining elements correctly.

To help Preact reconcile elements, use the `data-wp-key` directive on sibling elements that may change between navigations. This is especially important for **lists of elements** where items can appear, disappear, or reorder between pages. Without keys, Preact may incorrectly reuse DOM nodes, leading to mismatched state or visual glitches.

The `data-wp-key` directive works like the `key` prop in React or Preact — it gives the diffing algorithm a stable identity for each element:

```html
<ul>
	<li data-wp-key="item-1">First</li>
	<li data-wp-key="item-2">Second</li>
	<li data-wp-key="item-3">Third</li>
</ul>
```

Use a value that uniquely identifies each element across navigations, such as a post ID or slug — not an array index, which would change if items are reordered.

#### Do not mutate the DOM outside the Interactivity API

All DOM modifications should go through Interactivity API directives. Directly manipulating the DOM using vanilla JavaScript APIs — such as `document.createElement()`, `element.appendChild()`, `element.remove()`, or jQuery methods — is not compatible with CSN. The Interactivity API's virtual DOM diffing won't be aware of these changes, and they will be lost or cause conflicts during navigation.

For cases where you need to update the inner HTML of an element or make other imperative DOM changes, use the [`data-wp-watch`](/docs/reference-guides/interactivity-api/api-reference.md#wp-watch) directive. This directive runs a callback whenever reactive state changes, giving you a controlled way to perform side effects — including imperative DOM updates — that re-execute correctly after each navigation:

```html
<div
	data-wp-interactive="myPlugin"
	data-wp-watch="callbacks.updateContent"
></div>
```

```js
import { store } from '@wordpress/interactivity';

store( 'myPlugin', {
	callbacks: {
		updateContent() {
			const element = getElement();
			// Imperative DOM update driven by reactive state.
			element.ref.innerHTML = sanitizeHTML( state.dynamicContent );
		},
	},
} );
```

#### Do not create HTML dynamically outside router regions

Interactive blocks should avoid injecting new HTML elements into the DOM outside of router regions — for example, creating overlays, modals, or tooltips that are appended to the `<body>`.

The Interactivity API's client-side navigation only manages content inside [router regions](/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md#setting-up-router-regions). Any HTML created outside these regions won't be tracked, cleaned up, or updated during navigation.

If a block needs to render content outside its main region — for example, an overlay that must be a direct child of `<body>` — use the router's `attachTo` property to define a region that can be dynamically created during navigation. This is explained in the [Client-Side Navigation guide](/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md#attaching-new-router-regions).

## Compatibility checklist

Before marking your block as compatible with client-side navigation, verify the following:

-   [ ] The block does not inject `<style>` elements dynamically through JavaScript.
-   [ ] The block does not modify existing stylesheets at runtime (e.g., via CSSOM APIs).
-   [ ] CSS selectors (class names, IDs) are stable across navigations — no use of `wp_unique_id()` for selectors.
-   [ ] The block does not manipulate the DOM using APIs outside the Interactivity API (e.g., `document.createElement`, jQuery).
-   [ ] Any HTML that needs to live outside the block's region (e.g., overlays on `<body>`) uses `attachTo` to define its own region.
-   [ ] Lists of sibling elements that can change between navigations use `data-wp-key`.
-   [ ] The block uses script modules, not regular `<script>` tags.
-   [ ] CSS animations and transitions work correctly after a client-side navigation (they may need to be re-triggered).
-   [ ] The block works correctly with the [experimental full-page client-side navigation](/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md#full-page-client-side-navigation-experimental) mode.

## Quick reference

| Block type                                           | Compatible?                      | Action                                        |
| ---------------------------------------------------- | -------------------------------- | --------------------------------------------- |
| Non-interactive block (no JS)                        | Yes                              | Set `clientNavigation` to `true`              |
| Interactive block using the Interactivity API        | Yes (if guidelines are followed) | Set `interactivity` to `true`                 |
| Interactive block using other libraries              | No                               | Omit or set `clientNavigation` to `false`     |
| Block injecting or modifying CSS at runtime          | No                               | Use server-rendered styles or `data-wp-class` |
| Block using `wp_unique_id()` for CSS selectors       | No                               | Use `wp_unique_id_from_values()`              |
| Block mutating the DOM outside the Interactivity API | No                               | Use directives or `data-wp-watch`             |
| Block using regular scripts (not script modules)     | No                               | Migrate to script modules                     |
