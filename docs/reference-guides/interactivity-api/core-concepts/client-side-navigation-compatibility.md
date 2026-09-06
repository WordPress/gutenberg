# Client-Side Navigation Compatibility

Client-side navigation enables page transitions without a full page reload by updating only the parts of the page that change. For this to work correctly, **every interactive region on the page must be compatible with client-side navigation**. If any interactive region is incompatible, it may break silently after a navigation — losing state, failing to initialize, or rendering incorrectly.

Some core blocks like `core/query` detect incompatible descendants and automatically fall back to a full page reload, but this safety net does not apply to custom implementations. In general, a single incompatible interactive region on the page can compromise the entire navigation experience.

This guide explains what to consider when evaluating compatibility. While the examples focus on internative blocks, the same principles apply to any interactive region on the front end — including those included in classic PHP themes or plugins.

<div class="callout callout-info">

This guide assumes familiarity with <a href="https://developer.wordpress.org/block-editor/getting-started/">blocks</a>, <a href="https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/"><code>block.json</code></a>, and the basics of the <a href="https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/">Interactivity API</a>. If you're new to the Interactivity API, start with the <a href="https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/iapi-quick-start-guide/">Quick Start Guide</a> first.

</div>

For an overview of how client-side navigation works — including the fetch-diff-apply cycle, router regions, and styles and script module handling — see the [Client-Side Navigation guide](/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md).

## Declaring compatibility in `block.json`

Blocks declare client-side navigation compatibility through the `supports.interactivity.clientNavigation` property in `block.json`:

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

Even if a block appears to work fine with client-side navigation, the compatibility must always be explicitly declared in `block.json`. Right now, this property is the only way WordPress — other blocks, plugins, and themes — can determine whether your block is compatible with client-side navigation and, if it is not, disable it. For example, the `core/query` block checks this property on all its descendant blocks and falls back to full-page reloads when any of them are incompatible. In the future, this check may be automatically incorporated into the Interactivity API itself.

</div>

## What makes a block compatible

### Non-interactive blocks

Blocks that render HTML without any client-side interactivity — no JavaScript, no event listeners, no dynamic behavior — are compatible with client-side navigation. Since they don't rely on scripts to function, client-side navigation can safely replace their HTML without breaking anything.

However, compatibility must still be declared explicitly in `block.json`. The Interactivity API cannot infer compatibility on its own.

### Interactive blocks using the Interactivity API

Blocks that use the Interactivity API for their client-side behavior are designed to work with client-side navigation. The Interactivity API manages DOM updates through its [virtual DOM diffing algorithm](/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md), ensuring that interactive state is preserved across navigations.

That said, interactive blocks must follow certain practices to remain compatible. These guidelines cover three areas — CSS, JavaScript, and HTML — and are detailed in [Ensuring compatibility](#ensuring-compatibility).

The same applies for interactive regions included in classic PHP themes or plugins.

### Interactive blocks using vanilla JavaScript (DOM APIs) or other interactive libraries

Blocks that use vanilla JavaScript, jQuery, or any framework other than the Interactivity API for client-side behavior are **not compatible** with client-side navigation. Set `clientNavigation` to `false` (or omit it) for these blocks.

These blocks typically rely on scripts that run once on page load to initialize behavior — attaching event listeners, manipulating the DOM, or setting up widgets. During client-side navigation, the HTML may be replaced, but those initialization scripts won't run again and the internal JS representation of the actual DOM state might get out of sync, leaving the block non-functional.

### Quick reference

The table below summarizes the compatibility status and required action for each block type:

| Block type                                           | Compatible?                      | Action                                          |
| ---------------------------------------------------- | -------------------------------- | ----------------------------------------------- |
| Non-interactive block (no JS)                        | Yes                              | Set `clientNavigation` to `true`                |
| Interactive block using the Interactivity API        | Yes (if guidelines are followed) | Set `interactivity` to `true` (shorthand)       |
| Interactive block using other interactive libraries  | No                               | Omit or set `clientNavigation` to `false`       |
| Block injecting or modifying CSS at runtime          | No                               | Use server-rendered styles with `data-wp-class` |
| Block using `wp_unique_id()` for CSS selectors       | No                               | Use `wp_unique_id_from_values()`                |
| Block using regular scripts (not script modules)     | No                               | Migrate to script modules                       |
| Block importing from `window.wp.*` globals           | No                               | Use ES module imports                           |
| Block relying on DOM ready events for initialization | No                               | Use `data-wp-init`                              |
| Block mutating the DOM outside the Interactivity API | No                               | Use directives or `data-wp-watch`               |

The same applies for interactive regions included in classic PHP themes or plugins.

## Ensuring compatibility

Interactive blocks and regions that use the Interactivity API need to follow certain guidelines to work correctly with client-side navigation. The sections below are organized by the type of issue: CSS, JavaScript, and HTML.

### CSS

#### Do not inject CSS dynamically

Blocks that inject `<style>` or `<link>` elements through JavaScript at runtime are not compatible with client-side navigation.

The Interactivity API manages stylesheets during navigation by tracking the `<link>` and `<style>` elements that the server includes in the page. Styles created dynamically by client-side code fall outside this system — after navigating, the block may appear unstyled or with broken layout.

**Instead:** Use server-side logic to include the appropriate stylesheets when the block is rendered. For example, use the `style` property of your `block.json`, or conditionally enqueue a stylesheet in your block's render template.

#### Do not modify existing stylesheets using JavaScript

Programmatically modifying CSS rules at runtime is not compatible with client-side navigation. This includes using [CSSOM](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model) APIs like `CSSStyleSheet.insertRule()`, `CSSStyleSheet.deleteRule()`, or modifying `CSSStyleDeclaration` objects directly. These changes are not tracked by the Interactivity API and will be lost when the page's stylesheets are reconciled during navigation.

**Instead:** Use server-side logic to produce the correct stylesheets, or toggle CSS classes on elements using Interactivity API directives like `data-wp-class` or `data-wp-style`.

#### Use stable CSS selectors

CSS selectors (class names, IDs, etc.) must be **stable across navigations**. If a selector changes between page loads, styles may break or apply to the wrong elements after a client-side navigation.

This is especially important for elements **outside [router regions](/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md#setting-up-router-regions)** (regions are the areas of the page that the Interactivity API replaces during navigation). Since elements outside those regions are not replaced, the incoming page's stylesheets must continue to match them. If both pages share the same template this is usually the case, but mismatches can occur when different templates produce different wrapper elements or class names for shared layout elements like headers, footers, or sidebars.

CSS selectors applied to elements **inside router regions** must also be stable. Since regions are replaced during navigation, the incoming HTML must use the same selectors so that existing stylesheets continue to apply correctly.

One of the most frequent causes of client-side navigation compatibility failures is [`wp_unique_id()`](https://developer.wordpress.org/reference/functions/wp_unique_id/). This function generates sequential IDs (`id-1`, `id-2`, etc.) based on a global counter that resets on each page load. When navigating between two pages, the same block may receive a different ID on each page, causing the CSS selector to no longer match the element.

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

Client-side navigation only supports [script modules](https://make.wordpress.org/core/2024/03/04/script-modules-in-6-5/) (`<script type="module">`).

Regular scripts will **not** be re-executed when a page is visited through client-side navigation — so, for example, a jQuery slider or vanilla JS accordion will initialize only if it's included on the first page load, but not if it's only included on subsequent navigations.

The key rules for script modules and client-side navigation:

-   Only `<script type="module">` tags are supported. Regular `<script>` tags without `type="module"` are ignored during navigation.
-   Only **external** script modules (those with a `src` attribute) are processed. Inline script modules — where the code is written directly inside the `<script>` tag — are not re-executed.
-   The Interactivity API only loads modules that contain the `data-wp-router-options='{"loadOnClientNavigation":true}'` attribute.
    -   For blocks, the `loadOnClientNavigation` flag is set automatically when the script module is declared in `block.json` and `supports.interactivity` or `supports.interactivity.clientNavigation` is `true`.
    -   For non-block script modules (e.g., those enqueued by a theme or plugin), register the script module for client-side navigation explicitly using [`add_client_navigation_support_to_script_module()`](/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md#ensuring-script-modules-load-during-navigation).

```php
wp_interactivity()->add_client_navigation_support_to_script_module(
    'my-plugin/navigation-handler'
);
```

For more details on how script modules are handled during navigation, see the [Script module handling](/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md#script-module-handling) section of the Client-Side Navigation guide.

#### Do not import from `window.wp.*` globals

Accessing WordPress packages through global variables like `window.wp.element` or `window.wp.data` is not compatible with client-side navigation. These globals are set by regular scripts, which are not re-executed during client-side navigation.

**Instead:** Use ES module imports from the corresponding `@wordpress/*` script module, if one is available. For example, `@wordpress/a11y` is available both as a regular script (`window.wp.a11y`) and as a script module:

```js
// Avoid: Relies on a global set by a regular script.
const { speak } = window.wp.a11y;

// Preferred: ES module import, resolved by the script module system.
import { speak } from '@wordpress/a11y';
```

#### Do not rely on DOM ready events for initialization

Block hydration and initialization code should not depend on DOM ready events such as `DOMContentLoaded` or `load`. These events fire only once — on the initial full page load — and will not fire again after a client-side navigation. Any setup logic inside these listeners will not run when the user navigates to a new page.

**Instead:** Use the `data-wp-init` directive for code that needs to run each time the block enters the page:

```html
<div data-wp-interactive="myPlugin" data-wp-init="callbacks.setup">
	Block content
</div>
```

For code that needs to run on every navigation — such as analytics page-view tracking — use `data-wp-watch` with a reactive value that changes on each navigation, like the current URL from the global state:

```js
import { store } from '@wordpress/interactivity';

store( 'myPlugin', {
	callbacks: {
		logPageView() {
			// Re-runs on every navigation because state.url changes.
			const { url } = store( 'core/router' ).state;
			// Send analytics event for the new URL.
			sendPageView( url );
		},
	},
} );
```

```html
<div data-wp-interactive="myPlugin" data-wp-watch="callbacks.logPageView">
	Tracked content
</div>
```

From WordPress 7.0, you can also use the `watch` util to reexecute code on every navigation.

```js
import { store, watch } from '@wordpress/interactivity';

watch( () => {
	const { url } = store( 'core/router' ).state;
	// Send analytics event for the new URL.
	sendPageView( url );
} );
```

#### Use `getServerState()` and `getServerContext()` to sync server data

If your block's state or context needs to reflect server-rendered values on each navigation — for example, resetting a counter, updating a label, or syncing data that changes per page — use `getServerState()` and `getServerContext()` inside your callbacks. These functions return the values from the server-rendered HTML of the newly navigated page, allowing you to reconcile client-side state with fresh server data after each navigation.

For more details, see the [Server state and context](/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md#server-state-and-context) section of the Client-Side Navigation guide.

### HTML

#### Keep consistent HTML structures

Inconsistent HTML between pages can cause a modal to lose its open/closed state, interactive elements to stop responding, or lifecycle callbacks (like `data-wp-init` or `data-wp-watch`) to not re-execute when they should. This happens because the Interactivity API uses a [virtual DOM diffing algorithm under the hood](/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md), which compares the current and incoming HTML to calculate the minimum set of DOM changes. When the structure doesn't match, this algorithm may remount elements (losing state) or incorrectly reuse nodes (breaking behavior).

Common issues include:

-   **Different element structures**: If the same block renders a `<div>` on one page and a `<section>` on another, the virtual DOM algorithm treats them as entirely different elements and replaces the node, losing any state associated with it.
-   **Elements gaining or losing directives**: If an element has no Interactivity API directives on one page but gains `data-wp-bind` or similar on another, the diffing may not reconcile them correctly.
-   **Dynamic siblings**: When elements appear or disappear between pages (for example, conditional content), the virtual DOM algorithm may struggle to match the remaining elements correctly.

To help the virtual DOM algorithm reconcile elements, use the `data-wp-key` directive on sibling elements that may change between navigations. This is especially important for **lists of elements** where items can appear, disappear, or reorder between pages. Without keys, the virtual DOM algorithm may incorrectly reuse DOM nodes, leading to mismatched state or visual glitches.

The `data-wp-key` directive works like the `key` prop in React — it gives the diffing algorithm a stable identity for each element:

```html
<ul>
	<li data-wp-key="item-1">First</li>
	<li data-wp-key="item-2">Second</li>
	<li data-wp-key="item-3">Third</li>
</ul>
```

Use a value that uniquely identifies each element across navigations, such as a post ID or slug — not an array index, which would change if items are reordered. Common places where `data-wp-key` is needed include pagination controls, image galleries, and any query-driven list where items can change between pages.

#### Do not mutate the DOM outside the Interactivity API

Directly manipulating the DOM using vanilla JavaScript APIs — such as `document.createElement()`, `element.appendChild()`, `element.remove()`, or jQuery methods — is not compatible with client-side navigation. Elements added this way (like dynamically created tooltips or injected widgets) will vanish after navigating away and back, because the virtual DOM diffing is not aware of them.

Always use Interactivity API directives to modify DOM elements. For example, `data-wp-text`, `data-wp-bind`, `data-wp-each`, `data-wp-class`, `data-wp-style`, etc.

For cases where you need to update the inner HTML of an element or make other imperative DOM changes that are not possible using the existing directives, use the [`data-wp-watch`](/docs/reference-guides/interactivity-api/directives-and-store.md#wp-watch) directive. This directive runs a callback whenever [reactive state](/docs/reference-guides/interactivity-api/core-concepts/understanding-global-state-local-context-derived-state-and-config.md) changes, giving you a controlled way to perform side effects — including imperative DOM updates — that re-execute correctly after each navigation:

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
			const { ref } = getElement();
			// Imperative DOM update driven by reactive state.
			ref.innerHTML = state.dynamicContent;
		},
	},
} );
```

#### Do not create HTML dynamically outside router regions

Interactive blocks should avoid injecting new HTML elements into the DOM outside of router regions — for example, creating overlays, modals, or tooltips that are appended to the `<body>`.

The Interactivity API's client-side navigation only manages content inside [router regions](/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md#setting-up-router-regions). Any HTML created outside these regions won't be tracked, cleaned up, or updated during navigation.

If a block needs to render content outside its main boundaries — for example, an overlay that must be a direct child of `<body>` — use the router's `attachTo` property to define a region that can be dynamically created during navigation. This is explained in the [Client-Side Navigation guide](/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md#adding-new-regions-on-navigation).

## Verifying compatibility

After implementing the guidelines above, use the following approach to confirm that client-side navigation is working correctly with your block:

1. **Check for full-page reloads.** Open the browser's Network tab (DevTools), then click a link that navigates to a page containing your block. If client-side navigation is active, you'll see a `fetch` request for the new page's HTML instead of a full document navigation. A full document load means something on the page is incompatible — the Interactivity API fell back to a traditional navigation.
2. **Test interactive state preservation.** Open a modal, expand an accordion, or trigger any interactive state in your block. Navigate to another page and then back. If the block's state is preserved (or correctly re-initialized via `data-wp-init`), client-side navigation is working as expected. If the block appears frozen or unresponsive, check for DOM mutations or scripts running outside the Interactivity API.
3. **Test across different templates.** Navigate between pages that use different templates (e.g., a single post and an archive). This exercises the CSS selector stability and HTML structure consistency rules, since different templates may produce different wrapper elements.

## Compatibility checklist

Before marking your block as compatible with client-side navigation, verify the following:

-   The block does not inject `<style>` or `<link>` elements dynamically through JavaScript.
-   The block does not modify existing stylesheets at runtime (e.g., via CSSOM APIs).
-   CSS selectors (class names, IDs) are stable across navigations — no use of `wp_unique_id()` for selectors.
-   The block uses script modules, not regular `<script>` tags.
-   The block does not import from `window.wp.*` globals — it uses ES module imports instead.
-   The block does not rely on `DOMContentLoaded` or `load` events for initialization — it uses `data-wp-init` instead.
-   If the block needs to sync state or context from the server on each navigation, it uses `getServerState()` or `getServerContext()`.
-   Lists of sibling elements that can change between navigations use `data-wp-key`.
-   The block does not manipulate the DOM using APIs outside the Interactivity API (e.g., `document.createElement`, jQuery).
-   Any HTML that needs to live outside the block's boundaries (e.g., overlays on `<body>`) uses `attachTo` to define its own region.
-   (Optional) The block works correctly with the [experimental full-page client-side navigation](/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md#full-page-client-side-navigation-experimental) mode.
