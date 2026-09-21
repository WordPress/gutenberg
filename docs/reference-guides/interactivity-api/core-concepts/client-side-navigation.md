# Client-Side Navigation

Client-side navigation is a technique that allows navigation between pages without requiring a full page reload. Instead of the browser fetching an entirely new HTML document from the server, client-side navigation fetches the new page's content and updates only the parts of the DOM that have changed. This results in faster, smoother page transitions and a more app-like user experience.

The Interactivity API provides client-side navigation through the `@wordpress/interactivity-router` package. The central concept is the **router region**: a section of your page that the router knows how to update during navigation. You mark these sections with the `data-wp-router-region` directive, and when the user navigates to a new URL, the router fetches the destination page and replaces only the content inside matching regions — leaving everything else on the page untouched.

The Interactivity API supports two navigation modes:

-   **Region-based client-side navigation** — The recommended approach for implementing client-side navigation in WordPress.
-   **Full-page client-side navigation** _(experimental)_ — Treats the entire `<body>` element as a single region, effectively updating the whole page content without a traditional reload. Covered at the end of this guide in [Full-page client-side navigation (experimental)](#full-page-client-side-navigation-experimental).

<div class="callout callout-info">
To learn how to ensure your blocks and interactive elements are compatible with client-side navigation, see the <a href="https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/core-concepts/client-side-navigation-compatibility/">Client-Side Navigation Compatibility</a> guide.
</div>

## How client-side navigation works

When a user triggers a navigation, for example, by clicking a link that has a `data-wp-on--click` directive that calls `actions.navigate()`, the Interactivity Router:

1. **Fetches the new page**: The router requests the HTML of the destination URL.
2. **Parses the response**: It extracts the relevant regions, styles, scripts, and server-rendered data from the fetched HTML.
3. **Updates the DOM**: Only the content within designated "router regions" is replaced with the new content.
4. **Updates browser history**: A new entry is added to the browser's session history (or replaces the current entry if specified).
5. **Loads necessary assets**: Any new styles or script modules required by the new page are loaded before rendering.
6. **Handles accessibility**: Screen reader announcements are made to indicate navigation progress.

This approach offers several benefits:

-   **Improved performance**: Only the changed parts of the page are updated, reducing data transfer and DOM manipulation.
-   **Preserved state**: Client-side state (global state, local context) is preserved across navigations.
-   **Smooth transitions**: No flash of white screen between pages; transitions feel instant and app-like.
-   **SEO-friendly**: Since the server still renders complete HTML pages, search engines can crawl your site normally.

## Getting started with the Interactivity Router

The `@wordpress/interactivity-router` package is bundled with WordPress Core since version 6.5. If you are starting a new project, the easiest way to get set up is using the [`@wordpress/create-block-interactive-template`](https://www.npmjs.com/package/@wordpress/create-block-interactive-template) scaffolding tool. It offers a dedicated `client-side-navigation` variant that scaffolds a fully working block with client-side navigation already wired up — including router regions, prev/next navigation, a loading indicator, and a stopwatch that persists across navigations to demonstrate state persistence:

```bash
npx @wordpress/create-block@latest my-interactive-block --template @wordpress/create-block-interactive-template --variant client-side-navigation
```

You can also scaffold the default variant and add client-side navigation yourself:

```bash
npx @wordpress/create-block@latest my-interactive-block --template @wordpress/create-block-interactive-template
```

Whether you are working with a block or a classic theme, adding client-side navigation involves the same steps:

1. **Add the router dependency**: Add `@wordpress/interactivity-router` as a dependency of your script module.
2. **Ensure your script module loads during navigation**: Mark your script module so the router knows to load it on new pages.
3. **Define router regions**: Mark the HTML elements that should be updated during navigation using the `data-wp-router-region` attribute.
4. **Trigger navigation**: Use the router's `actions.navigate()` function to navigate programmatically.

Steps 1 and 2 differ depending on whether you are working with a block or a classic theme, and are covered right below. Steps 3 and 4 are the same regardless of your setup.

### Adding the router dependency

The `@wordpress/interactivity-router` module should be added as a dynamic dependency so it is only fetched when needed.

For **blocks**, this is done by dynamically importing the package in your `view.js` file. The block build tooling (`wp-scripts`) detects the dynamic import and registers the PHP-side dependency automatically:

```js
const { actions } = yield import( '@wordpress/interactivity-router' );
yield actions.navigate( url );
```

For **classic themes**, instead of relying on a block's `block.json`, you register and enqueue your script module manually in PHP, listing `@wordpress/interactivity-router` as a dynamic dependency. You also add the Interactivity API directives directly in your theme's template files and process them with `wp_interactivity_process_directives()`, as explained in the [Server-side rendering](/docs/reference-guides/interactivity-api/core-concepts/server-side-rendering.md#processing-directives-in-classic-themes) guide.

```php
// functions.php
add_action( 'wp_enqueue_scripts', function () {
    wp_register_script_module(
        'my-theme/navigation',
        get_template_directory_uri() . '/assets/navigation.js',
        array(
			'@wordpress/interactivity',
			array(
				'id'     => '@wordpress/interactivity-router',
				'import' => 'dynamic',
			),
		)
    );
    wp_enqueue_script_module( 'my-theme/navigation' );
} );
```

### Ensuring script modules load during navigation

During client-side navigation, the router needs to know which script modules should be loaded on the new page. It identifies them by looking for a `data-wp-router-options` attribute on the `<script>` tag with `loadOnClientNavigation` set to `true`. Without this attribute, the router will not load the script module during client-side navigation, and the block's interactivity will not work on the new page.

For **blocks**, this attribute is added automatically when the block declares interactivity support in its `block.json`. Either of these configurations will work:

```json
{
	"supports": {
		"interactivity": true
	}
}
```

```json
{
	"supports": {
		"interactivity": {
			"clientNavigation": true
		}
	}
}
```

If your block's `block.json` already includes one of these, no additional setup is needed — WordPress handles the rest.

For **classic PHP themes** and other script modules registered outside of `block.json`, the attribute is not added automatically. You must register your script module for client-side navigation explicitly using `add_client_navigation_support_to_script_module()`:

```php
wp_interactivity()->add_client_navigation_support_to_script_module(
    'my-theme/navigation'
);
```

<div class="callout callout-info">
To understand what makes a block (or interactive elements in a classic PHP theme) compatible with client-side navigation, see the <a href="https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/core-concepts/client-side-navigation-compatibility/">Client-Side Navigation Compatibility</a> guide.
</div>

Without this, the router will not load your script module when navigating to a page that needs it.

### Setting up router regions

A router region is a section of your page that the router updates during client-side navigation. You define one by adding both `data-wp-router-region` and `data-wp-interactive` to the same element — both directives are required at this moment.

**Leaving out `data-wp-interactive` produces no error, and nothing looks wrong until the first navigation.** The Interactivity API resolves a directive's namespace from the nearest ancestor carrying `data-wp-interactive`, so a region element that inherits its namespace from an ancestor hydrates normally and all of its directives work. The router, however, looks for regions with a selector that requires `data-wp-interactive` on the region element _itself_, so it never finds that region on the pages it fetches. On every client-side navigation the router clears the regions it knows about before writing the destination's content back into them, and a region it could not find on the destination page is left cleared. So the symptom is a region that works perfectly on load and then **silently empties the first time you navigate**, with nothing in the console. If that is what you are seeing, check this attribute first.

The `data-wp-router-region` directive takes a unique ID as its value. When navigation occurs, the router matches regions on the current page with regions on the target page by their IDs and replaces their content — leaving everything outside router regions untouched. Each region ID must be unique within a page; if two regions share the same ID, the router won't know which one to update.

Here's a basic router region:

```php
<div
    data-wp-interactive="myPlugin"
    data-wp-router-region="myPlugin/posts-list"
>
    <?php foreach ( $posts as $post ) : ?>
        <article>
            <h2><?php echo esc_html( $post->post_title ); ?></h2>
            <p><?php echo esc_html( $post->post_excerpt ); ?></p>
        </article>
    <?php endforeach; ?>
</div>
```

#### Where to place router regions

Router regions can be placed anywhere on the page. Their behavior depends on where they sit relative to other interactive elements and other router regions:

-   **As a standalone element** — When a router region is not inside any existing `data-wp-interactive` element, it serves a dual role: it is the interactive boundary (since it also contains `data-wp-interactive`) _and_ its content is updated during navigation:

    ```html
    <div
    	data-wp-interactive="myPlugin"
    	data-wp-router-region="myPlugin/content"
    >
    	<!-- Interactive boundary + navigable region -->
    	<p data-wp-text="state.message">Hello</p>
    </div>
    ```

-   **Inside an interactive element** — When a router region is nested inside an element that already has `data-wp-interactive`, the region becomes part of that element's interactivity. The parent interactive element stays untouched during navigation, but the region's content is updated:

    ```html
    <div data-wp-interactive="myPlugin">
    	<h1>This heading is never updated during navigation</h1>

    	<div
    		data-wp-interactive="myPlugin"
    		data-wp-router-region="myPlugin/posts"
    	>
    		<!-- This content is updated during navigation -->
    	</div>
    </div>
    ```

    Note that the router region still needs its own `data-wp-interactive` directive, even though it is already inside one.

-   **Inside another router region** — When a router region is nested inside another router region, it becomes part of the parent region. The parent region is updated as a single unit during navigation; the nested region is not processed independently:

    ```html
    <div data-wp-interactive="myPlugin" data-wp-router-region="myPlugin/main">
    	<!-- This inner region is part of "myPlugin/main" -->
    	<div
    		data-wp-interactive="myPlugin"
    		data-wp-router-region="myPlugin/sidebar"
    	>
    		<!-- Updated together with the parent region -->
    	</div>
    </div>
    ```

    Nesting does change what a navigation started from inside the inner region reports as its initiator. The outer region is still the update unit, but a derived initiator is the **nearest** enclosing region — so a navigation started from inside `myPlugin/sidebar` publishes `"myPlugin/sidebar"` on `state.initiator`, even though `myPlugin/main` is what the router replaces. Identity here is attribution — who started this navigation — not a claim about what gets updated. See [Who initiated the navigation](#who-initiated-the-navigation).

### Implementing navigation

To trigger client-side navigation, you define an **action** in your store and connect it to a DOM event using an Interactivity API directive. Actions are functions defined inside `store()` that handle user interactions. When connected to an element through a directive like `data-wp-on--click`, the action runs whenever that event fires.

Here's how to implement a link that navigates client-side. First, the HTML connects the link's click event to the `navigateTo` action:

```html
<a data-wp-on--click="actions.navigateTo" href="/page-2/"> Go to Page 2 </a>
```

Then, in your script module, you define the `navigateTo` action. It prevents the browser's default full-page navigation and uses the router's `navigate()` function instead:

```js
// view.js
import { store, withSyncEvent } from '@wordpress/interactivity';

store( 'myPlugin', {
	actions: {
		navigateTo: withSyncEvent( function* ( event ) {
			event.preventDefault();

			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( event.target.href );
		} ),
	},
} );
```

<div class="callout callout-info">
The <code>withSyncEvent()</code> wrapper is required for actions that need to call synchronous event methods like <code>event.preventDefault()</code>. See the <a href="https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/directives-and-store/#withsyncevent">withSyncEvent() documentation</a> for details.
</div>

### Implementing prefetching

The router also provides a `prefetch()` function that fetches a page and stores it in an internal in-memory cache without performing navigation. By prefetching pages before the user clicks, subsequent navigations feel instant because the content is already available.

A common pattern is to prefetch a page when the user hovers over a link, and navigate when they click. You can combine both behaviors on the same element using two directives — `data-wp-on--mouseenter` for prefetching and `data-wp-on--click` for navigation:

```html
<a
	data-wp-on--mouseenter="actions.prefetchPage"
	data-wp-on--click="actions.navigateTo"
	href="/page-2/"
>
	Hover to prefetch, click to navigate
</a>
```

The corresponding actions in the script module handle each event:

```js
// view.js
import { store, withSyncEvent } from '@wordpress/interactivity';

store( 'myPlugin', {
	actions: {
		prefetchPage: function* ( event ) {
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.prefetch( event.target.href );
		},

		navigateTo: withSyncEvent( function* ( event ) {
			event.preventDefault();

			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( event.target.href );
		} ),
	},
} );
```

### Complete example: Pagination

This example brings together router regions, navigation, and prefetching to implement client-side pagination for a list of posts.

The PHP template queries posts for the current page and renders them inside a router region. Pagination links at the bottom allow the user to move between pages. When the user hovers over a "Previous" or "Next" link, the target page is prefetched. When they click, the router navigates client-side — replacing only the content inside the router region without a full page reload. After navigation, the page scrolls smoothly to the top.

**PHP:**

```php
<?php
$current_page = isset( $_GET['paged'] ) ? absint( $_GET['paged'] ) : 1;
$query = new WP_Query( array(
    'paged'          => $current_page,
    'posts_per_page' => 5,
) );
?>

<div
    data-wp-interactive="myPagination"
    data-wp-router-region="myPagination/posts"
>
    <ul class="posts-list">
        <?php while ( $query->have_posts() ) : $query->the_post(); ?>
            <li>
                <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
            </li>
        <?php endwhile; wp_reset_postdata(); ?>
    </ul>

    <nav class="pagination">
        <?php if ( $current_page > 1 ) : ?>
            <a
                data-wp-on--mouseenter="actions.prefetch"
                data-wp-on--click="actions.navigate"
                href="?paged=<?php echo $current_page - 1; ?>"
            >
                &larr; Previous
            </a>
        <?php endif; ?>

        <span>Page <?php echo $current_page; ?></span>

        <?php if ( $query->max_num_pages > $current_page ) : ?>
            <a
                data-wp-on--mouseenter="actions.prefetch"
                data-wp-on--click="actions.navigate"
                href="?paged=<?php echo $current_page + 1; ?>"
            >
                Next &rarr;
            </a>
        <?php endif; ?>
    </nav>
</div>
```

**JavaScript:**

```js
import { store, withSyncEvent } from '@wordpress/interactivity';

store( 'myPagination', {
	actions: {
		prefetch: function* ( event ) {
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.prefetch( event.target.href );
		},

		navigate: withSyncEvent( function* ( event ) {
			event.preventDefault();

			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( event.target.href );

			// Scroll to top after navigation.
			window.scrollTo( { top: 0, behavior: 'smooth' } );
		} ),
	},
} );
```

## More advanced use cases

### Handling scroll and focus

The router does not automatically manage scroll position or focus after navigation — this is the responsibility of the action that calls `actions.navigate()`. After a client-side navigation completes, the page will remain at its current scroll position and the focus will stay on the element that triggered the navigation (or be lost if that element was removed during the region update).

You should handle scroll and focus explicitly in your navigation action. For example, to scroll to the top after navigation:

```js
store( 'myPlugin', {
	actions: {
		navigateTo: withSyncEvent( function* ( event ) {
			event.preventDefault();

			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( event.target.href );

			// Scroll to top after navigation.
			window.scrollTo( { top: 0, behavior: 'smooth' } );
		} ),
	},
} );
```

For accessibility, consider moving focus to a meaningful element after navigation, such as the main content area or a heading, so keyboard and screen reader users know where they are on the new page.

The pattern above only runs for navigations this action started. If your focus code should also cover navigations it did not start — another link inside the same region, or a back/forward traversal it should deliberately decline — react to the end of the navigation instead, with a watcher built from the router's lifecycle state. [Recipe: region-scoped focus after navigation](#recipe-region-scoped-focus-after-navigation) below shows that watcher, and [Subscribing to page changes](#subscribing-to-page-changes) describes the state it reads.

One timing difference is worth knowing before you swap one for the other: `actions.navigate()`'s promise resolves once the new content is committed, while the end transition is published on a later frame, so an end watcher acts roughly a frame after the `await` above returns. The exact delay is not guaranteed — see [When each transition happens](#when-each-transition-happens). The `await` pattern remains the right tool for focus work that only ever follows a navigation you started yourself.

### Adding new regions on navigation

Sometimes you need UI elements — like modals, sidebars, or notification panels — that only appear on certain pages. With regular router regions, a region must already exist on the current page to be updated during navigation. The `attachTo` option solves this by letting you define regions that are dynamically created and inserted into the DOM when navigating to a page where they exist, even if they weren't present on the original page.

**Defining a region with `attachTo`:**

```html
<div
	data-wp-interactive="myPlugin"
	data-wp-router-region='{ "id": "myPlugin/modal", "attachTo": "body" }'
>
	<div class="modal-overlay">
		<div class="modal-content">
			<h2>Modal Title</h2>
			<p>Modal content here...</p>
		</div>
	</div>
</div>
```

The `attachTo` value is a CSS selector. When navigating to this page from a page without this region, the region will be created and appended to the element matching the selector.

**Example: Modal that appears on navigation**

_Page without modal (page-1.php):_

```php
<div
    data-wp-interactive="myPlugin"
    data-wp-router-region="myPlugin/content"
>
    <h1>Page 1</h1>
    <a
        data-wp-on--click="actions.navigate"
        href="/page-with-modal/"
    >
        Open page with modal
    </a>
</div>
```

_Page with modal (page-2.php):_

```php
<div
    data-wp-interactive="myPlugin"
    data-wp-router-region="myPlugin/content"
>
    <h1>Page 2</h1>
    <a
        data-wp-on--click="actions.navigate"
        href="/page-without-modal/"
    >
        Close modal
    </a>
</div>

<div
    data-wp-interactive="myPlugin"
    data-wp-router-region='{ "id": "myPlugin/modal", "attachTo": "body" }'
>
    <div class="modal-overlay">
        <div class="modal-content">
            <h2>I'm a modal!</h2>
        </div>
    </div>
</div>
```

When navigating from Page 1 to Page 2, the modal region is created and appended to `<body>`. When navigating back to Page 1, the modal is automatically removed.

### Preserving elements with `data-wp-key`

During client-side navigation, the router uses Preact's reconciliation algorithm to update the content inside router regions. This algorithm relies on heuristics to efficiently match elements between the current and target pages. These heuristics work well for most cases, but they can fail under certain conditions — for example, when two elements have the same type and position on different pages but use different directives. In such cases, the algorithm may incorrectly treat them as the same element, leading to corrupted state or broken behavior.

To prevent this, you can use the `data-wp-key` directive to give elements a stable, explicit identity. When the reconciliation algorithm encounters keyed elements, it matches them by key instead of relying on heuristics. Elements with matching keys are updated in place, preserving their internal state: focus, scroll position, CSS animations, form input values, and any JavaScript references to the DOM node. Unmatched elements are cleanly removed or created as needed.

Keys are especially important in two scenarios:

1. **Lists that change across pages** — such as paginated posts, filtered results, or sorted tables.
2. **Regions whose structure differs between pages** — for example, a region that contains a sidebar on one page but not on another, or pages that render different blocks in the same region.

Without keys, the reconciliation heuristics may incorrectly match unrelated elements that happen to share the same type and position. In the best case this causes unnecessary DOM recreation; in the worst case it can corrupt element state or produce broken markup — for example, applying one element's directives to a completely different element.

With keys based on a stable identifier, the algorithm can match elements by identity instead of relying on heuristics. This ensures that each element is correctly identified across navigations.

**PHP:**

```php
<div
    data-wp-interactive="myPagination"
    data-wp-router-region="myPagination/posts"
>
    <ul>
        <?php while ( $query->have_posts() ) : $query->the_post(); ?>
            <li data-wp-key="post-<?php echo get_the_ID(); ?>">
                <a href="<?php the_permalink(); ?>">
                    <?php the_title(); ?>
                </a>
            </li>
        <?php endwhile; wp_reset_postdata(); ?>
    </ul>
</div>
```

Each `<li>` is keyed by the post ID. If the user navigates from one page of results to another and a post appears on both pages, the router reuses the existing DOM node for that post rather than destroying and recreating it.

Keys are equally useful for non-list elements. If a router region renders structurally different content on different pages, keying the top-level sections helps the algorithm tell them apart:

```php
<div
    data-wp-interactive="myPlugin"
    data-wp-router-region="myPlugin/content"
>
    <?php if ( is_product_page() ) : ?>
        <section data-wp-key="product-detail">
            <!-- Product detail layout -->
        </section>
    <?php else : ?>
        <section data-wp-key="product-list">
            <!-- Product list layout -->
        </section>
    <?php endif; ?>
</div>
```

Without keys, navigating between these two pages would cause the algorithm to patch the product-detail `<section>` into the product-list `<section>` (or vice versa) by position, potentially corrupting their internal state. With distinct keys, the algorithm recognizes they are different elements and cleanly replaces one with the other.

#### Choosing good key values

A key should be:

-   **Stable**: The same item should always produce the same key, regardless of its position in the list.
-   **Unique among siblings**: No two sibling elements should share the same key. Keys only need to be unique within their parent, not globally.

Use data-derived identifiers whenever possible — post IDs, term IDs, or any value that uniquely identifies the item. Avoid using array indices as keys, because indices change when items are reordered, added, or removed, which defeats the purpose of keying.

```html
<!-- Good: stable, data-derived key -->
<li data-wp-key="post-42">...</li>

<!-- Bad: index-based key (changes when items shift) -->
<li data-wp-key="item-0">...</li>
```

### Handling server state updates

During client-side navigation, the client-side state persists while the server provides new state for the target page. In some cases, you may want parts of your client state to stay in sync with what the server provides for each page — for example, updating a product count that changes across pages, or resetting an "expanded" flag based on the new page's context.

**That syncing does not happen on its own, and it is worth knowing why before you rely on a server-seeded value.** When the router loads a page, it merges that page's server data into the client state _without overriding_: a key that already exists keeps the value it has, and only genuinely new keys are added. This is deliberate — it lets blocks that first appear on the new page initialize from the server without discarding changes the visitor made on the current one. The consequence is that a binding reading a server-seeded key goes on showing whatever the **first** page seeded it with, on every later navigation, unless you re-sync it yourself. Nothing warns and nothing errors; the value simply stops tracking the page.

Use `getServerState()` and `getServerContext()` to react specifically to server-provided values and selectively update the client state in a callback. Unlike the client state they update, these two always return the current page's server data:

```js
import {
	store,
	getContext,
	getServerState,
	getServerContext,
} from '@wordpress/interactivity';

const { state } = store( 'myPlugin', {
	callbacks: {
		syncWithServer() {
			const serverState = getServerState();
			const serverContext = getServerContext();
			const context = getContext();

			// Keep the product count in sync with the server across navigations.
			if ( serverState.productCount !== undefined ) {
				state.productCount = serverState.productCount;
			}

			// Reset the expanded state based on the new page's context.
			if ( serverContext.isExpanded !== undefined ) {
				context.isExpanded = serverContext.isExpanded;
			}
		},
	},
} );
```

For the full account of the merge, including what happens to context as well as to state, see [How server context and state merging works during navigation](/docs/reference-guides/interactivity-api/directives-and-store.md#how-server-context-and-state-merging-works-during-navigation). For more on the two functions themselves, see the [Understanding global state, local context, and derived state](/docs/reference-guides/interactivity-api/core-concepts/understanding-global-state-local-context-derived-state-and-config.md#subscribing-to-server-state-and-context) guide.

### Overriding router's internal in-memory cached pages

By default, once a page is stored in the router's internal in-memory cache, subsequent navigations use the cached version without making a new network request. Use the `force` option to bypass the router's internal in-memory cache and re-fetch the page from the server:

```js
// Force re-fetch with navigate().
yield actions.navigate( '/products/', { force: true } );

// Force re-fetch with prefetch().
yield actions.prefetch( '/products/', { force: true } );
```

<div class="callout callout-warning">
If you're using <code>force: true</code> to refresh a page after a mutation (POST, PUT, DELETE request), make sure the mutation has completed before navigating:
</div>

```js
store( 'myPlugin', {
	actions: {
		deleteAndRefresh: function* () {
			// Wait for the deletion to complete.
			yield fetch( '/wp-json/wp/v2/posts/123', { method: 'DELETE' } );

			// Now refresh the page to show updated data.
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( window.location.href, { force: true } );
		},
	},
} );
```

### Using custom HTML

Instead of fetching a page from a URL, you can provide HTML directly using the `html` option:

```js
// Navigate with custom HTML.
yield actions.navigate( '/custom-page/', {
    html: `
        <div data-wp-interactive="myPlugin" data-wp-router-region="myPlugin/content">
            <h1>Custom Content</h1>
            <p>This HTML was provided directly, not fetched.</p>
        </div>
    `,
} );

// Prefetch with custom HTML.
yield actions.prefetch( '/custom-page/', {
    html: customHtmlString,
} );
```

This is useful when you need to control the `fetch` request yourself.

### Managing browser history

By default, `navigate()` adds a new entry to the browser's session history using `pushState`. Use the `replace` option to replace the current history entry instead:

```js
// Default behavior: adds new history entry (pushState).
yield actions.navigate( '/page-2/' );

// Replace current history entry (replaceState).
yield actions.navigate( '/page-2/', { replace: true } );
```

Use `replace: true` when:

-   Updating query parameters for filtering/sorting where each change shouldn't be a separate history entry.
-   Implementing infinite scroll where you update the URL but don't want each page to be a separate history entry.

### Changing the timeout

If navigation takes too long, the router falls back to a traditional full-page load. The default timeout is 10 seconds. Use the `timeout` option to change this:

```js
// Shorter timeout for faster failure.
yield actions.navigate( '/page/', { timeout: 5000 } );

// Longer timeout for slow connections.
yield actions.navigate( '/page/', { timeout: 30000 } );
```

### Handling fetch errors

When navigation fails (network error, timeout, or server error), the router automatically falls back to a full page reload. This means you cannot catch fetch errors from `navigate()` directly — the browser takes over before your code has a chance to handle them.

If you need custom error handling (for example, showing an error message instead of reloading), you can fetch the page manually, handle any errors yourself, and then pass the fetched HTML to `navigate()` using the `html` option:

```js
store( 'myPlugin', {
	actions: {
		navigateWithCustomErrorHandling: withSyncEvent( function* ( event ) {
			event.preventDefault();
			const url = event.target.href;

			try {
				// Fetch the page manually.
				const response = yield fetch( url );

				if ( ! response.ok ) {
					// Handle HTTP errors.
					state.error = `Error: ${ response.status }`;
					return;
				}

				const html = yield response.text();

				// Navigate using the fetched HTML.
				const { actions } = yield import(
					'@wordpress/interactivity-router'
				);
				yield actions.navigate( url, { html } );
			} catch ( error ) {
				state.error = 'Network error. Please check your connection.';
			}
		} ),
	},
} );
```

### Disabling client-side navigation on certain pages

Some pages may require a full page reload instead of client-side navigation. Use `wp_interactivity_config()` to disable client navigation:

```php
// In your theme's functions.php or a plugin.
add_action( 'wp', function() {
    // Disable on specific page templates.
    if ( is_page_template( 'template-complex.php' ) ) {
        wp_interactivity_config(
            'core/router',
            array( 'clientNavigationDisabled' => true )
        );
    }
} );
```

When `clientNavigationDisabled` is `true`:

-   `actions.navigate()` triggers a full page reload.
-   `actions.prefetch()` does nothing.
-   Navigating from another page to this page forces a reload.

### Disabling navigation feedback

The Interactivity API router includes built-in feedback during navigation:

-   **Loading animation**: A progress bar that appears at the top of the page during navigation. The bar appears after a short delay (400ms) if navigation hasn't completed yet. This 400ms delay is introduced to avoid showing the animation if the page has been successfully prefetched or in very fast connections.
-   **Screen reader announcements**: Accessibility announcements for navigation progress.

In some cases, you may want to disable these:

```js
// Disable loading animation (for instant-feeling updates).
yield actions.navigate( '/page/', { loadingAnimation: false } );

// Disable screen reader announcements (when providing custom announcements).
yield actions.navigate( '/page/', { screenReaderAnnouncement: false } );

// Disable both.
yield actions.navigate( '/page/', {
    loadingAnimation: false,
    screenReaderAnnouncement: false,
} );
```

Use cases for disabling feedback:

-   **Silent updates**: Background refreshes where you don't want to draw attention.
-   **Custom loading UI**: When you're implementing your own loading indicators.
-   **Custom accessibility**: When you're providing your own screen reader announcements.

### Subscribing to page changes

The `core/router` store exposes a reactive `state.url` property that updates every time a client-side navigation occurs. By reading this value inside a `data-wp-watch` or `watch` callbacks, you create a reactive subscription that re-runs whenever the URL changes.

```js
// view.js
import { watch, store } from '@wordpress/interactivity';

// Store-wide subscription.
watch( () => {
	const { state } = store( 'core/router' );
	sendAnalyticsPageView( state.url );
} );

// Element-based subscription: <div data-wp-watch="callbacks.sendPageView">
store( 'myPlugin', {
	callbacks: {
		sendPageView() {
			const { state } = store( 'core/router' );
			sendAnalyticsPageView( state.url );
		},
	},
} );
```

<div class="callout callout-info">
The `core/router` store and `state.url` are available and populated on page load, so there's no need to import the `@wordpress/interactivity-router` package to access them.
</div>

#### The navigation lifecycle keys

`state.url` tells you _where_ you ended up. Two further reactive keys on the same `core/router` store tell you about the navigation itself:

-   **`state.navigating`** — truthy while a client-side navigation is in flight.
-   **`state.initiator`** — a string identifying who started the navigation that is in flight, or `null` when the navigation has no identifiable initiator.

Neither key is declared when the router registers its store, so **before the first client-side navigation both read `undefined`** — and the same `undefined` is what you read on a page where the router module has not loaded yet, or never loads at all (a page with no router region and nothing that navigates). Nothing errors and nothing warns; the keys are simply absent.

<div class="callout callout-info">
Consume the lifecycle by truthiness: write <code>if ( state.navigating )</code> and <code>state.initiator === myId</code>, not <code>state.navigating === false</code> or <code>state.initiator === null</code>. Both keys have two "nothing is happening" readings — the <code>undefined</code> before the router has ever run, and the <code>false</code>/<code>null</code> it writes afterwards.
</div>

Two consequences are worth internalizing before you write any code against these keys:

-   **The two idle readings are not equal.** `state.navigating` reads `undefined` before the first navigation and `false` after one has ended. `state.initiator` reads `undefined` before the first navigation and `null` for a navigation with no identifiable initiator. Both pairs are falsy, which is why truthiness is the reliable test.
-   **"The router is not here" is indistinguishable from "nothing is navigating."** This is deliberate. A consumer asking "is a navigation in flight?" gets the right answer on both kinds of page, and a block that binds an indicator to `state.navigating` simply renders its idle state on pages that never navigate.

The keys are left undeclared rather than seeded with idle values on purpose: giving them a value at registration would flip them from `undefined` to that value the moment the router module is lazily imported, re-running every watcher already bound to them even though no navigation had happened.

One visible effect of the `undefined` reading is worth knowing if you bind to it directly: `data-wp-bind--aria-busy="state.navigating"` renders **no `aria-busy` attribute at all** while the key is `undefined`, rather than `aria-busy="false"`. Once the first navigation has run, the binding renders `"true"` and `"false"` as expected.

#### When each transition happens

**The start** is published as soon as the navigation enters the client-side pipeline — before the destination is fetched, and before any waiting. In particular:

-   There is **no 400 ms gate** on it. The 400 ms threshold described in [Disabling navigation feedback](#disabling-navigation-feedback) governs Core's loading animation and the screen reader announcement, nothing else. A navigation served from the router's cache in a few milliseconds still publishes a start.
-   `navigate()`'s options do not suppress it. `loadingAnimation: false` and `screenReaderAnnouncement: false` change the built-in feedback, not the lifecycle.
-   It fires for a navigation to the URL you are already on — the `navigate( window.location.href, { force: true } )` refresh pattern.
-   `state.navigating` and `state.initiator` are written together in a single batch, so watchers observe both change in one notification. `state.navigating` never reads truthy alongside a stale or absent `state.initiator`.

**The end** is published after the new content is committed: by the time your callback runs, the destination's region content is already in the DOM and `state.url` already reads the destination URL. It lands **on a later frame** than the commit, and the delay between the two is deliberately unbounded — treat it as "some time after the commit", never as a specific number of frames, a microtask, or a fixed position relative to other deferred work.

"On a later frame" is not a detail; it is what makes both transitions observable. `data-wp-watch` coalesces every change landing within one frame into a single run, so if the end were published in the same flush as the start, a fast navigation would produce one run showing only the finished state: an indicator would never light, and a callback watching for a navigation to end would never see one begin.

Two idioms that look right and do not work:

-   `yield actions.navigate( url ); if ( state.navigating ) { … }` — `navigate()`'s promise resolves before the end transition is published, so `state.navigating` is still truthy immediately after it. React to the end with a watcher, not with the promise.
-   `state.navigating === false` as an "idle" test — `false` is only one of the two idle readings, as described above.

Finally, the end transition writes `state.navigating` only. **`state.initiator` is retained**: it keeps the finished navigation's value until the next navigation's start overwrites it, which is exactly what lets a callback reacting to the end still read who initiated what just ended. The consequence is that a level-triggered condition such as `! state.navigating && state.initiator === myId` stays true for the whole idle window afterwards, not just at the transition — so reactions to the end of a navigation should be triggered by the change itself rather than by the condition holding.

#### Which navigations are covered

Covered — each of these publishes a start and, on completion, an end:

-   Every `actions.navigate()` call that proceeds as a client-side navigation, from any call site and with any options: an action bound to a directive, scope-less code that imported the router itself, or full-page mode's document-level click listener.
-   Every back/forward traversal the router serves from its in-memory page cache.

Not covered — the lifecycle reads idle throughout, exactly as if nothing had happened:

-   A `navigate()` call rejected at the router's entry check, on a page where [client-side navigation is disabled](#disabling-client-side-navigation-on-certain-pages). The call hands the navigation to the browser before any client-side work begins.
-   A back/forward traversal to a page the router has not cached, which forces a full page reload.
-   `actions.prefetch()`, always. Prefetching is not navigating: a hover that armed a "navigation started" reading would corrupt every loading indication on the page.

**A failure is never reported as an ending.** A navigation that starts client-side and then falls back to a full page load mid-flight — a failed fetch, a non-200 response, an unparseable response, the navigation timeout, or a fetched page whose own configuration disables client-side navigation — publishes its start and then never publishes an end. `state.navigating` stays truthy until the browser replaces the document. (`navigate()`'s promise never resolves on that path either; that is existing behavior.) That is the only situation in which the in-flight reading persists, and a full page load is already underway when it does.

#### Overlapping navigations

The router is latest-wins, and the lifecycle follows it. From the first navigation's start through the winning navigation's end, `state.navigating` reads in flight **continuously**: no idle gap in between, and no second end transition when a superseded navigation reaches its own conclusion. When the winner ends, the lifecycle reads idle once.

`state.initiator` always identifies the most recent navigation. The moment a second navigation starts it replaces the first one's identity — including replacing it with `null`, when the newcomer has no identity of its own. A back/forward traversal landing while a navigation is in flight does exactly that: it takes over the lifecycle and clears the initiator.

For a per-region indication, that gives you the behavior you want with no bookkeeping of your own: a region whose navigation is superseded by another region's stops reading as the origin at the moment of supersession, and two overlapping navigations from the _same_ region keep that region reading as the origin until the last of them is no longer in flight.

#### Who initiated the navigation

`actions.navigate()` accepts an `initiator` option with three arms:

```js
// Derive it from where the call was made (the default).
yield actions.navigate( url );

// Declare it explicitly.
yield actions.navigate( url, { initiator: 'myPlugin/cart' } );

// Suppress attribution.
yield actions.navigate( url, { initiator: null } );
```

-   **A string** is published on `state.initiator` verbatim, and always wins: derivation is not consulted. This is how a block declares an identity of its own, readable by any consumer — including one in a different store that does not own the action that navigated.
-   **`null`** suppresses attribution. `state.initiator` reads `null` for the whole navigation, even when the call was made from inside a router region.
-   **Omitted** derives the initiator from the ambient directive scope: the nearest enclosing element carrying `data-wp-router-region`, counting the initiating element itself. When regions are nested, the **nearest** one wins — the outer region is still the unit the router updates, but the inner region is what initiated the navigation.
-   Any other value — a number, an object, `false` — is not a valid arm. It is dropped to `null` and, with `SCRIPT_DEBUG` enabled, logs a warning. It never falls through to derivation.

Derivation never throws. A call made with no directive scope at all, a scope whose element is not an element, an element with no enclosing router region: each of them yields `null`. The absence of an identity is a normal value in this API, not an error to handle.

#### What `state.initiator` compares against

`state.initiator` publishes the region's **id**, not the raw `data-wp-router-region` attribute text. Three rules follow, and each is a comparison that silently never matches if you get it wrong — there is no error to diagnose, only a condition that is never true:

-   For the JSON object form the directive also accepts — `data-wp-router-region='{ "id": "myPlugin/modal", "attachTo": "body" }'`, as used in [Adding new regions on navigation](#adding-new-regions-on-navigation) — the initiator is `"myPlugin/modal"`, the value of `id`. Comparing against the whole attribute string never matches.
-   A `namespace::` prefix is not part of the id and is stripped: a region declared as `data-wp-router-region="myPlugin::sidebar"` derives `"sidebar"`.
-   An empty attribute, a JSON object with no `id`, or an `id` that is not a non-empty string derives `null` — never an empty string.

In short, compare against the id you gave the region, spelled exactly as you gave it.

#### Navigations with no initiator

`state.initiator` reads `null` — an explicit "no initiator", never a stale or guessed one — in these cases:

-   **Back/forward traversals.** The visitor asked the browser to go back; no block initiated anything. This is what lets a consumer tell a traversal apart from a navigation it started itself, and refrain accordingly.
-   **Links handled by full-page mode's document-level listener**, wherever the link sits. A post-title link inside a Query block's region was not initiated by the Query block: DOM containment is not initiation.
-   **Programmatic calls with no directive scope** — a module that imports the router and calls `navigate()` from its own code rather than from inside an action bound to an element.
-   **Navigations started reactively from inside the router's own write frames.** A `watch()` that reacts to `state.navigating`, `state.initiator` or `state.url` and navigates in turn does not inherit the identity of the navigation it is reacting to. (A `data-wp-watch` reacting to the same change runs a frame later, outside those frames, and derives its own region as usual.)

Because `state.initiator` is overwritten at every start, no stale identity is ever reported: whatever the previous navigation published is replaced when the next one begins, `null` included.

**Full-page mode changes one of these readings.** There, the `<body>` element itself carries `data-wp-router-region="core/body"`, so a _scoped_ control — an element with a directive of your own that calls `navigate()` — sitting outside every block's router region derives `core/body`, where the same markup in region-based mode derives no initiator at all. A plain link with no directives reads absent in both modes.

**Two authoring mistakes quietly cost you attribution:**

-   **Do not hoist `actions.navigate` to module scope.** The scope is captured when the action is read off the store, so reading it inside your own action — `const { actions } = yield import( '@wordpress/interactivity-router' ); yield actions.navigate( href );` — derives correctly, while a module-level `const navigate = actions.navigate` captured outside any scope derives nothing.
-   **If you navigate from a callback that is itself reacting to a lifecycle write, declare the initiator.** Derivation deliberately refuses to attribute those navigations, as described above, so passing `initiator` explicitly is what keeps them identified.

#### Telling which region started a navigation

The router publishes no per-region flag; the two keys compose into one:

```js
const startedHere = state.navigating && state.initiator === myRegionId;
```

Derived identity is **region-granular**. Two blocks inside the same router region share one derived identity — that region's id — and derivation alone cannot tell them apart. When you need finer granularity, either give each instance its own router region or declare an `initiator` of your own.

Core's Query block with enhanced pagination is the worked case of that rule, and it already works with no setup on any block. Query's render callback puts `data-wp-router-region="query-{queryId}"` on every enhanced-pagination instance, and Query's own click handler calls `actions.navigate()` from inside that region — so `state.initiator` reads that instance's region id while the navigation is in flight and at the moment it ends, and two Query blocks on one page are distinguishable without a line of code on either. Two details are worth a clause each: the pagination link itself belongs to the Query Pagination blocks, which delegate the click across namespaces with `data-wp-on--click="core/query::actions.navigate"` — derivation follows the DOM scope, not the store namespace, so the delegation changes nothing; and a Query block is its own region, so it needs neither of the identity options above. The [Complete example: Pagination](#complete-example-pagination) earlier in this guide has the same shape.

#### Choosing where to read the lifecycle

Which primitive you read the keys from decides when your code runs and what it can see:

-   **`data-wp-bind`, `data-wp-class`, `data-wp-text` and other bindings** update as part of Preact's own re-render, scheduled asynchronously after the change rather than during it. That is all a purely visual indication needs.
-   **`data-wp-watch`** runs in the element's directive scope, so `getContext()` and `getElement()` are available inside it. It is deferred by a frame and coalesces changes landing within the same frame, and a callback reacting to the end transition sees the newly committed DOM. Derived state getters evaluated through a directive run in that element's scope too.
-   **`watch()`**, the utility from `@wordpress/interactivity`, runs **synchronously** at the moment a value changes and has **no directive scope** — `getContext()` and `getElement()` are not available inside it. Use it for page-level work that only touches store state. Because it runs synchronously, a `watch()` keyed on `state.url` runs before the new region content has been rendered and observes the _old_ DOM; keyed on the end transition it runs after the commit and observes the new one. See the [`watch()` reference](/docs/reference-guides/interactivity-api/directives-and-store.md#watch).
-   **`data-wp-init`** runs in scope once per element, which makes it the place for setup that belongs to hydration rather than to a navigation.

#### What the API does not promise

Both keys are public, supported API, and both are meant to keep working as the router grows. A few things they deliberately do not commit to:

-   **The set of state keys on `core/router` is not closed.** Read the keys you know and ignore the rest; never enumerate the store's state or assert on its shape.
-   **`state.navigating` stays truthy for the whole of a navigation**, including across any finer phases added later — a pre-commit signal for view transitions, for instance. Consuming it by truthiness is what keeps a block working across those additions.
-   **The delay between the commit and the end transition is unbounded.** Do not depend on a frame count, on a microtask, or on your callback running before or after anyone else's deferred work.

The new keys also do not change the deprecated `state.navigation.hasStarted` / `hasFinished` flags in place. Reading `state.navigating` or `state.initiator` never emits the `state.navigation` deprecation warning, and the deprecated flags still warn, still work, and are unchanged until their scheduled removal in WordPress 7.1. They were never a lifecycle: they are presentation state for Core's loading bar, gated by the 400 ms delay and written only when `loadingAnimation` is on.

#### Recipe: a per-block loading indication

Blocks have shown "this block is loading" with a hand-rolled flag for as long as the router has existed. The `create-block` scaffold's client-side navigation variant is the canonical shape: the block's own action writes `state.isNavigating = true` before it calls `actions.navigate()` and `false` after the call resolves, and a `data-wp-bind--hidden="!state.isNavigating"` reveals a "Loading…" element in between.

It works, and it has three limits the two lifecycle keys remove:

-   It only knows about navigations that action started. A back/forward traversal, or a navigation another block on the page starts, leaves it reading idle.
-   The flag lives in that store's global state, so every instance of the block on the page lights up at once.
-   It is private by convention. Another block that wants to dim itself while the gallery navigates would have to know that plugin's namespace and the name it happened to give its flag, where `core/router`'s two keys are one well-known place every consumer already reads.

The replacement is a derived state getter composing the two keys, bound through a directive:

```js
// view.js
import { store } from '@wordpress/interactivity';

// Read `core/router`; do not import it. Reading a namespace creates it, and
// it merges into the router's own store if and when that module loads — so
// this is safe on a page where the router never loads at all.
const { state: routerState } = store( 'core/router' );

store( 'myPlugin', {
	state: {
		get isLoading() {
			return (
				!! routerState.navigating &&
				routerState.initiator === 'myPlugin/quote'
			);
		},
	},
} );
```

```html
<div data-wp-interactive="myPlugin" data-wp-router-region="myPlugin/quote">
	<span data-wp-class--is-loading="state.isLoading"></span>
</div>
```

The `!!` is there so the getter returns a boolean rather than `undefined`: `state.navigating` reads `undefined` before the first navigation, and `undefined && …` evaluates to `undefined`. Directive bindings treat both as falsy, so the indication renders correctly either way, but a getter that other code may read is better off with a boolean.

That is the whole composition. It has two identity tiers, differing only in what the comparison's right-hand side is.

**The static tier: one region id, written at authoring time.** This is the scaffold's own shape and it needs no extra markup at all — the region id in the getter is the same literal as the one in `data-wp-router-region`.

What the comparison must match is the region's **id**, not the raw attribute text. If the region is declared in the JSON object form the directive also accepts — `data-wp-router-region='{ "id": "myPlugin/modal", "attachTo": "body" }'`, the form used in [Adding new regions on navigation](#adding-new-regions-on-navigation) — then the value to compare against is `'myPlugin/modal'`, and comparing against the attribute string never matches. The same applies to a `namespace::` prefix, which is not part of the id. See [What `state.initiator` compares against](#what-stateinitiator-compares-against) for the full rule; the failure is silent, so it is worth checking once rather than debugging later.

**The per-instance tier: one region per instance, its id co-rendered into context.** When the same block appears more than once on a page and each copy needs its own indication, give each copy its own router region and write that id into the block's own context at render time:

```php
<?php
$region_id = "myPlugin/gallery-{$instance_id}";
?>
<div
	data-wp-interactive="myPlugin"
	data-wp-router-region="<?php echo esc_attr( $region_id ); ?>"
	<?php echo wp_interactivity_data_wp_context( array( 'regionId' => $region_id ) ); ?>
>
	<span data-wp-class--is-loading="state.isLoading"></span>
</div>
```

The getter reads it back with `getContext()`, so one getter serves every instance:

```js
// view.js
import { getContext, store } from '@wordpress/interactivity';

const { state: routerState } = store( 'core/router' );

store( 'myPlugin', {
	state: {
		get isLoading() {
			const { regionId } = getContext();
			return (
				!! routerState.navigating && routerState.initiator === regionId
			);
		},
	},
} );
```

The extra context line is worth being honest about, because a reader who knows `getElement()` will spot the alternative immediately. There is a DOM route: a getter evaluated through a directive runs in that element's scope, so `getElement().ref.closest( '[data-wp-router-region]' )` can find the enclosing region element and read its attribute back. That is precisely the walk `core/query` still performs today — `ref.closest( '.wp-block-query[data-wp-router-region]' )` in `packages/block-library/src/query/view.js` — and precisely the walk this feature exists to retire. The claim for the context line is not that no other route exists; it is that the context line hands the getter a value the block already knew when it rendered, instead of re-deriving it from the DOM on every evaluation and having to reimplement the id normalization above to do it.

**On the initial page load and on a traversal:** both keys read `undefined` on the initial page load, so the getter returns `false` and the indication renders idle — on every page, including one where the router module never loads. On a back/forward traversal `state.navigating` goes truthy but `state.initiator` reads `null` throughout, so the comparison fails and the indication stays idle. That is the intended answer: a traversal is not something your block started.

Finally, the case that needs no recipe at all, and is the one many readers arrive with: **a block that is already its own router region needs neither tier.** Core's Query block with enhanced pagination is that case — its render callback writes `data-wp-router-region="query-{queryId}"` on every instance — so two Query blocks on one page are already distinguishable through `state.initiator`, with no setup on either. See [Telling which region started a navigation](#telling-which-region-started-a-navigation).

#### Recipe: region-scoped focus after navigation

Moving focus after a navigation is the accessibility work [Handling scroll and focus](#handling-scroll-and-focus) asks for, and the usual way to do it is inside the navigating action, after the `await`. Core's Query block does exactly that: it walks the DOM for its own region with `closest()`, then focuses the first anchor inside it once `actions.navigate()` resolves.

Reacting to the end of the navigation instead moves that code out of the call site. It runs for any navigation started from inside the region — every link, every action, without repeating the focus code at each one — and it puts the region's identity in the condition rather than in a DOM walk. It also makes the traversal case an explicit decision instead of an accident of where the code sits.

Put a `data-wp-watch` inside each region, edge-trigger it on the falling edge of `state.navigating`, and act only when `state.initiator` still reads as that region's own id:

```js
// view.js
import { getContext, store } from '@wordpress/interactivity';

const { state: routerState } = store( 'core/router' );

// The previous `navigating` reading, per region. See the two notes below for
// why this lives neither in `context` nor on the region element.
const wasNavigating = {};

store( 'myPlugin', {
	callbacks: {
		focusAfterNavigation() {
			const { regionId } = getContext();
			const navigating = !! routerState.navigating;

			if (
				wasNavigating[ regionId ] &&
				! navigating &&
				routerState.initiator === regionId
			) {
				// Looked up after the edge fires, never captured before
				// the navigation: the region's content has been replaced
				// by now.
				document
					.querySelector(
						`[data-wp-router-region="${ regionId }"] a`
					)
					?.focus();
			}

			wasNavigating[ regionId ] = navigating;
		},
	},
} );
```

The watcher lives on its own element inside the region, and the region's id reaches it through the same context line the per-instance tier above uses:

```html
<div
	data-wp-interactive="myPlugin"
	data-wp-router-region="myPlugin/gallery-1"
	data-wp-context='{ "regionId": "myPlugin/gallery-1" }'
>
	<span data-wp-watch="callbacks.focusAfterNavigation"></span>
</div>
```

If the region id is a literal you wrote by hand, drop the `getContext()` line and compare against that literal, exactly as the static tier does above.

**React to the edge, not to the condition.** `state.initiator` is retained after the end transition — it keeps the finished navigation's value until the next navigation starts, as described in [When each transition happens](#when-each-transition-happens). So the level-triggered form `! state.navigating && state.initiator === regionId` is true not only at the moment the navigation ends but for the whole idle window afterwards, and a callback written that way would move focus again on every later re-run. Comparing against the previous reading is what makes it fire exactly once, at the transition.

**Keep the bookkeeping out of `context`.** A callback that both reads and writes the same value through the reactive `context` proxy subscribes itself to its own write and re-triggers. The previous `navigating` reading is bookkeeping, not something the page renders, so a plain module-scope object is the right home for it.

**Keep the bookkeeping off the region element too.** A navigation can tear the region's DOM down and rebuild it while your module stays loaded, so anything stored on the element itself does not survive the very navigation it is trying to measure. A module-scope object keyed by region id does, and one object serves every region on the page.

**Capture no DOM reference across the navigation.** The focus target is looked up after the falling edge fires, never before it. By the time the end transition is published the destination's content is already committed, so the lookup finds the new page's element — see [When each transition happens](#when-each-transition-happens).

**On the initial page load and on a traversal:** the callback runs once at hydration, reads `state.navigating` as `undefined`, records `false` and does nothing. On a back/forward traversal it runs on both edges — traversals publish the lifecycle like any other navigation — but `state.initiator` reads `null` throughout, so the comparison fails and the callback refrains. That is deliberate: a visitor who pressed Back asked the browser to restore a page, and moving focus on their behalf is usually the wrong call. The `await` pattern never gets to make that choice, because it never runs on a traversal at all.

#### Recipe: a debounced page-level loading bar

The router's built-in loading animation appears only if the navigation is still in flight after 400 ms, so a prefetched or cached navigation never flashes a bar at the visitor. If you turn that animation off and draw your own — see [Disabling navigation feedback](#disabling-navigation-feedback) — reproduce the debounce rather than binding a bar straight to `state.navigating`: arm a timer on the rising edge, clear it on the falling edge.

This is page-level work that only touches store state, so it needs no directive scope. Use `watch()`, the module-scope utility from `@wordpress/interactivity`, rather than a `data-wp-watch`. The timer callback writes this store's own `state`, not `context`, which is exactly why it can run outside any scope:

```js
// view.js
import { store, watch } from '@wordpress/interactivity';

const { state: routerState } = store( 'core/router' );

const { state } = store( 'myPlugin', {
	state: {
		// This store's own state, declared with an idle default. Unlike the
		// router's two keys, it is not a passthrough of anything.
		showBar: false,
	},
} );

let timer;

watch( () => {
	if ( routerState.navigating ) {
		timer = setTimeout( () => {
			state.showBar = true;
		}, 400 );
	} else {
		clearTimeout( timer );
		state.showBar = false;
	}
} );
```

```html
<div
	data-wp-interactive="myPlugin"
	data-wp-class--show-bar="state.showBar"
></div>
```

The callback reads `state.navigating` and nothing else, so it re-runs only when that key changes — which is what keeps the timer from being armed twice. Three consequences follow from that, and none of them needs bookkeeping of your own:

-   **Overlapping navigations arm the timer once.** From the first start through the winning navigation's end, `state.navigating` reads in flight continuously, with no idle gap and no second end transition, so the callback runs once on the way in and once on the way out. A double click does not restart the debounce or flicker the bar. See [Overlapping navigations](#overlapping-navigations).
-   **A navigation that falls back to a full page load keeps the bar up.** Such a navigation publishes its start and never publishes an end, so the timer is never cleared — which is the right outcome, because a full page load really is still in progress until the browser replaces the document. See [Which navigations are covered](#which-navigations-are-covered).
-   **On a traversal the bar behaves as it does for any other navigation.** Back/forward traversals publish the lifecycle too, and because the router serves them from its in-memory page cache they almost always finish well inside the 400 ms window, so no bar appears.

On the initial page load `state.navigating` reads `undefined`, so the first run takes the `else` branch: `clearTimeout()` on an unset timer does nothing and `showBar` is already `false`. The first run is a no-op on every page, including one where the router module never loads.

## The Interactivity Router in depth

This section provides a detailed technical explanation of how client-side navigation works internally. Understanding these internals can help you debug issues, optimize performance, and make informed decisions about how to structure your code.

### The internal in-memory page cache

At the heart of the Interactivity API router is an internal in-memory page cache — a simple store that maps URLs to their processed page representations. When you call `prefetch()` or `navigate()`, the router first checks this cache to see if the target page has already been fetched and processed.

The cache uses a normalized version of the URL as its key. This normalization strips away the domain and any hash fragments, keeping only the pathname and query parameters. For example, `https://example.com/products/?category=shoes#details` becomes `/products/?category=shoes`. This ensures that navigations to the same logical page (regardless of how the URL was constructed) share the same cache entry.

Each entry in the cache stores not just the fetched HTML, but a fully processed page representation containing:

-   **Virtual DOM trees** for each router region found in the page
-   **Style sheet references** needed by the page
-   **Script module information** for JavaScript that should be loaded
-   **The page title** for updating the document title
-   **Server state** that was embedded in the page by WordPress

An important detail is that the cache stores promises rather than resolved values. When a fetch begins, the router immediately stores the pending promise in the cache. This means that if multiple calls to `prefetch()` or `navigate()` target the same URL simultaneously (for example, if a user rapidly hovers over multiple links pointing to the same page), only one network request is made. All callers receive the same promise and wait for the same result.

Once a page is in the cache, it remains there for the duration of the browser session. Subsequent navigations to that URL will use the cached version instantly, without any network request. This is why client-side navigation feels so fast after the initial visit — the page is already prepared and ready to render.

If you need to force a fresh fetch (for example, after submitting a form that changes the page's content), you can use the `force: true` option with `navigate()` or `prefetch()`. This bypasses the cache check and fetches the page anew, replacing the existing cache entry with the fresh content.

```js
// Force a fresh fetch after a form submission.
const { actions } = store( 'myPlugin', {
	actions: {
		*submitForm() {
			yield fetch( '/wp-json/my-plugin/v1/submit', {
				method: 'POST',
				body: JSON.stringify( {
					/* form data */
				} ),
			} );
			// Navigate to the same page, bypassing the cache
			// to reflect the updated content.
			const { actions: routerActions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield routerActions.navigate( window.location.href, {
				force: true,
			} );
		},
	},
} );
```

### Router regions

Router regions are the sections of your page that the router knows how to update during client-side navigation. They act as boundaries that tell the router "this is the content that should change when navigating between pages."

**Defining router regions**

You define a router region by adding the `data-wp-router-region` attribute to an element alongside `data-wp-interactive` (as described in [Setting up router regions](#setting-up-router-regions) above).

The attribute value serves as a unique identifier for that region. You can specify it in two ways:

1. As a simple string:

    ```html
    <div
    	data-wp-interactive="myPlugin"
    	data-wp-router-region="myPlugin/main-content"
    >
    	<!-- Region content -->
    </div>
    ```

2. As a JSON object (when you need to pass other options):
    ```html
    <div
    	data-wp-interactive="myPlugin"
    	data-wp-router-region='{ "id": "myPlugin/modal", "attachTo": "body" }'
    >
    	<!-- Region content -->
    </div>
    ```

The region ID must be unique within a single page and consistent across pages that share the same region. For example, if both your "Products" page and "Product Detail" page have a sidebar, and you want that sidebar to update during navigation, both pages should define a region with the same ID (e.g., `"myPlugin/sidebar"`).

**How regions are processed during page fetch**

When the router fetches a new page (either through `prefetch()` or as part of `navigate()`), it processes the HTML to extract and prepare all router regions. This happens in several steps:

First, the router parses the fetched HTML into a document structure using the browser's built-in HTML parser. This gives it a complete DOM tree to work with, just as if the page had been loaded normally.

Next, the router scans this document for all elements that have both `data-wp-interactive` and `data-wp-router-region` attributes. For each region found, it extracts the region ID and checks whether the region is nested inside another region. Only top-level regions are processed directly; nested regions are handled as part of their parent's content.

For each top-level region, the router converts the HTML into a virtual DOM (vDOM) representation. The virtual DOM is a lightweight JavaScript object structure that mirrors the actual DOM but can be compared and manipulated much more efficiently by the Interactivity API. Importantly, the region element itself is included in this conversion — not just its children. This means that attributes on the region element, such as `data-wp-context`, will also be processed and updated during navigation.

Finally, each region's virtual DOM is stored in the page cache entry, indexed by its region ID. The cache entry now contains a map of region IDs to their corresponding virtual DOM trees.

Beyond processing regions, the router also extracts the page's CSS stylesheets and JavaScript script modules during this step. New stylesheets that haven't been loaded yet are added to the document in a disabled state so the browser can begin downloading them without applying them. Similarly, new script modules are identified and their dependency trees are resolved and fetched. These assets are prepared in advance so that when navigation actually renders the new content, all necessary styles and scripts are ready. The details of how styles and script modules are handled are covered in the [CSS handling](#css-handling) and [Script module handling](#script-module-handling) sections below.

**How regions are rendered during navigation**

When `navigate()` is called and the target page has been successfully fetched (or was already cached), the router needs to update the current page to show the new content. This rendering process is carefully orchestrated to be efficient and avoid visual glitches.

The router begins by examining which regions exist in the current page and which exist in the target page. Based on this comparison, three different scenarios can occur:

**Scenario 1: Region exists on both pages (update)**

This is the most common case. When a region with a given ID exists on both the current page and the target page, the router updates the existing region with the new content.

Rather than simply replacing the entire region's HTML (which would destroy any internal state and cause a jarring visual transition), the router uses a virtual DOM diffing algorithm. This algorithm compares the current region's virtual DOM with the new region's virtual DOM and calculates the minimum set of changes needed to transform one into the other.

For example, if a product list region contains 10 products on the current page and 10 different products on the new page, the diffing algorithm might determine that it only needs to update the text content and image sources within the existing list item elements — rather than destroying and recreating all 10 items from scratch. This preserves DOM state (like scroll position within the region, or focus state) and produces smoother visual transitions.

The reconciliation algorithm relies on heuristics that can fail when elements share the same type and position but represent different things. You can use the `data-wp-key` directive to give elements a stable identity, ensuring they are correctly matched across navigations. See [Preserving elements with `data-wp-key`](#preserving-elements-with-data-wp-key) for details.

**Scenario 2: Region exists only on the target page with `attachTo` (create)**

Sometimes a page contains a region that doesn't exist on the current page — for example, a modal dialog that only appears on certain pages. If this region has the `attachTo` property specified, the router will dynamically create it.

The `attachTo` property contains a CSS selector that identifies where in the current page the new region should be appended. When the router encounters such a region, it:

1. Finds the element matching the `attachTo` selector in the current page
2. Creates new DOM elements for the region
3. Appends these elements to the matched parent
4. Renders the region's virtual DOM into the newly created elements

This allows content that exists on one page but not another to appear smoothly during navigation, without requiring the target element to exist in advance.

**Scenario 3: Region exists only on the current page (remove)**

When a region exists on the current page but not on the target page, it means that content is no longer needed. The router handles this by setting the region's content to empty, effectively clearing it from the display.

If the region was dynamically created via `attachTo` during a previous navigation, the entire region element is removed from the DOM. If it was part of the original page structure, the element remains but its content is cleared.

**What happens to HTML outside router regions?**

An important detail to understand is that HTML outside of router regions remains completely untouched during client-side navigation. The router only modifies the content inside the regions it manages — everything else in the DOM stays exactly as it was.

This means that if you have static elements like a site header, footer, or navigation menu that aren't wrapped in a router region, they won't change when the user navigates between pages. This can be intentional (for elements that truly are the same across all pages) or it can be a source of confusion if you expect those elements to update.

However, there's an important exception: **interactive elements outside router regions can still react to global state changes**. If you have an interactive element outside any router region, with directives that use `getServerState()` to read global state, these directives will automatically re-evaluate when navigation brings in new server state.

For example, consider a shopping cart icon in the header that displays the number of items:

```html
<!-- This header is NOT inside a router region -->
<header data-wp-interactive="myShop">
	<div class="cart-icon">
		<span data-wp-text="state.cartCount"></span> items
	</div>
</header>

<!-- This is the router region that updates during navigation -->
<main data-wp-interactive="myShop" data-wp-router-region="myShop/content">
	<!-- Page content -->
</main>
```

If `state.cartCount` comes from the regular client-side state, the cart icon will not update during navigation — even if the new page has a different cart count in its server state. The header, while being interactive, is outside any router region, so it's not re-rendered.

But if you use `getServerState()` instead:

```js
const { state } = store( 'myShop', {
	state: {
		get cartCount() {
			// This reacts to server state changes during navigation.
			return getServerState().cartCount;
		},
	},
} );
```

Now the cart icon will update whenever navigation brings in a new `cartCount` value from the server, even though the header itself is outside any router region. This is because `getServerState()` creates a reactive subscription to server-provided state, which is updated during every navigation.

This pattern is useful for global UI elements that need to stay synchronized with server data across navigations, without requiring them to be inside a router region. However, `getServerState()` can also be used to synchronize the `state` of interactive elements inside router regions, as described in the [Handling server state updates](#handling-server-state-updates) section.

### CSS handling

One of the trickier aspects of client-side navigation is managing CSS style sheets. Different pages may require different styles, and the router must ensure that the correct styles are active for each page — without causing flashes of unstyled content or breaking the CSS cascade order.

**The challenge of CSS cascade order**

CSS rules are applied in a specific order, and when two rules have the same specificity, the one that appears later in the document "wins." This means that the order of `<link>` and `<style>` elements in your HTML matters. If the router simply appended new style sheets to the end of the document, it could inadvertently change which rules take precedence, causing visual bugs.

Consider this example: Page A has style sheets `base.css` and `theme.css`, and Page B has `base.css`, `components.css` and `theme.css`. If the user navigates from A to B, the router needs to insert `components.css` between `base.css` and `theme.css` — not at the end. Otherwise, any rules in `theme.css` that are meant to override `components.css` would stop working.

**How styles are extracted and prepared**

When the router fetches a page, it extracts all style-related elements: both `<link rel="stylesheet">` tags and inline `<style>` blocks. Each style element is identified by a combination of its attributes (for `<link>` tags, primarily the `href`) or its content hash (for inline `<style>` blocks).

The router then compares the extracted styles with those already present in the current page's document. Styles fall into three categories:

1. **Already present**: The style sheet is already loaded in the current page. No action needed during preparation.
2. **New**: The style sheet doesn't exist in the current page. It needs to be added.
3. **No longer needed**: The style sheet is in the current page but not in the target page. It will be disabled during navigation.

**Preloading new styles without applying them**

For new style sheets, the router faces a dilemma: it needs to ensure the styles are fully loaded before showing the new page content (to prevent flash of unstyled content), but it doesn't want to apply them yet (because the user is still viewing the current page).

The solution is to add new `<link>` elements with their `media` attribute set to a value that prevents them from applying. The router uses `media="preload"`, which tells the browser "this style sheet applies to no media types" — effectively disabling it while still allowing the browser to download and parse it.

When a `<link>` element is added this way, the browser begins downloading the CSS file immediately. The router tracks when each style sheet finishes loading by listening for the `load` event. This allows it to wait until all new styles are ready before proceeding with navigation.

**Maintaining cascade order with the Shortest Common Supersequence algorithm**

When inserting new style sheets, the router must preserve the correct cascade order. It accomplishes this using an algorithm based on finding the Shortest Common Supersequence (SCS) of two sequences.

Given the current page's style sheets (sequence X) and the target page's style sheets (sequence Y), the SCS algorithm finds the shortest sequence that contains both X and Y as subsequences while preserving their internal order. This tells the router exactly where to insert new elements and which existing elements to keep.

For example:

-   Current page styles (X): [A, C, D]
-   Target page styles (Y): [A, B, C, E]
-   Shortest Common Supersequence: [A, B, C, D, E]

The algorithm then determines: keep A and C in place, insert B between A and C, keep D after C, and insert E at the end.

This approach ensures that:

-   Style sheets that appear in both pages remain in their correct relative order
-   New style sheets are inserted at the proper position to maintain cascade correctness
-   The minimum number of DOM operations is performed

**Activating and deactivating styles during navigation**

When `navigate()` actually renders the new page, the router toggles style sheets on and off:

-   **Activating styles**: For each style sheet that belongs to the target page, the router restores the original `media` attribute (reverting the `media="preload"` override set during prefetching) and sets `sheet.disabled = false`. This causes the browser to apply those styles.

-   **Deactivating styles**: For each style sheet that was in the current page but not the target page, the router sets `sheet.disabled = true`. This disables the styles without removing the element from the DOM.

By keeping deactivated style elements in the DOM (rather than removing them), the router can quickly reactivate them if the user navigates back. The styles are already loaded and parsed; they just need to be re-enabled.

### Script module handling

The Interactivity API uses [script modules](https://make.wordpress.org/core/2024/03/04/script-modules-in-6-5/) for interactive behavior. The router must ensure that when navigating to a new page, the required script modules are loaded and executed.

**Identifying script modules for client-side navigation**

Not all script modules should be loaded during client-side navigation. Some modules might be for admin functionality, or for features that only apply on initial page load. As described in the [Getting started](#getting-started-with-the-interactivity-router) section, WordPress uses the `data-wp-router-options` attribute to mark which script modules should be loaded during navigation:

```html
<script
	type="module"
	src="/wp-content/plugins/my-plugin/view.js"
	data-wp-router-options='{"loadOnClientNavigation": true}'
></script>
```

When the router fetches a page, it scans for all `<script type="module">` elements that have this attribute with `loadOnClientNavigation` set to `true`. These are the modules it will preload and execute.

**Processing the import map**

Modern JavaScript uses import maps to resolve bare module specifiers (like `@wordpress/interactivity`) to actual URLs. WordPress generates an import map that tells the browser where to find each module:

```html
<script type="importmap">
	{
		"imports": {
			"@wordpress/interactivity": "/wp-includes/js/dist/interactivity.min.js",
			"@wordpress/interactivity-router": "/wp-includes/js/dist/interactivity-router.min.js"
		}
	}
</script>
```

When the router fetches a new page, it extracts the import map from that page and merges any new mappings with the current page's import map. This ensures that script modules can resolve their dependencies correctly even when navigating between pages that have different sets of scripts.

**Preloading script modules and their dependencies**

Preloading script modules requires resolving their full dependency tree, since a single entry-point module might depend on dozens of other script modules, which might depend on dozens more.

To handle this, the router performs a recursive dependency resolution:

1. It fetches the source code of each entry-point script module
2. It parses the source to find all `import` statements
3. For each import, it resolves the script module specifier using the import map
4. It recursively fetches and parses each dependency
5. This continues until all script modules in the dependency tree have been fetched

The router is smart about avoiding redundant work. If a script module has already been loaded by the initial page (it appears in the initial import map), the router doesn't fetch it again — the browser already has it cached.

**Handling the import timing**

An important subtlety is that script module code shouldn't execute until navigation actually happens. The router needs to have the script module code ready (to avoid delays during navigation), but it shouldn't run that code while the user is still viewing the current page.

The router accomplishes this by transforming the fetched script modules. It rewrites the source code to use blob URLs (data embedded directly in the URL) and caches these transformed script modules. When navigation occurs, the router uses dynamic `import()` to execute the cached script modules.

Because the browser's module system caches script modules by URL, importing the same blob URL multiple times returns the same module instance. This ensures that each script module is only executed once, even if multiple code paths try to import it.

**Script module execution during navigation**

When `navigate()` renders the new page, it imports all the script modules that were preloaded for that page:

```js
// Simplified conceptual view of what happens.
for ( const moduleInfo of page.scriptModules ) {
	await import( moduleInfo.blobUrl );
}
```

Each script module's top-level code runs, which typically includes calls to `store()` to register actions, callbacks, and state. Because the Interactivity API's store is global and additive, these registrations merge with existing store definitions from the initial page load.

### Server state and context

Interactive elements often need data from the server — configuration values, content from the database, user preferences, and more. The Interactivity API provides three mechanisms for this: [global state, local context and config](/docs/reference-guides/interactivity-api/core-concepts/understanding-global-state-local-context-derived-state-and-config.md).

During client-side navigation, this server-provided data needs to be extracted from the new page and made available to the client-side code.

**How server data is embedded in pages**

When WordPress renders a page with interactive elements, it embeds server-provided data in special `<script>` tags:

```html
<!-- Global state -->
<script
	type="application/json"
	id="wp-script-module-data-@wordpress/interactivity"
>
	{
		"state": {
			"myPlugin": {
				"cartItemCount": 3
			}
		},
		"config": {
			"myPlugin": {
				"userLoggedIn": true
			}
		}
	}
</script>
```

Local context is embedded directly in the `data-wp-context` attribute of elements:

```html
<div
	data-wp-interactive="myPlugin"
	data-wp-context='{ "productId": 42, "inStock": true }'
>
	<!-- Content -->
</div>
```

**Extracting state, context and config during fetch**

When the router fetches a new page, it extracts these types of server data:

1. **Global state**: The router finds the `<script type="application/json">` element with ID `wp-script-module-data-@wordpress/interactivity` and parses its JSON content to extract its `state` property. This state comes from `wp_interactivity_state` is stored in the internal in-memory page cache entry.

2. **Local context**: Context values are embedded in the virtual DOM representation of each router region. When a region's HTML is converted to vDOM, the `data-wp-context` attributes are preserved and will be processed during rendering.

3. **Config**: The router finds the `<script type="application/json">` element with ID `wp-script-module-data-@wordpress/interactivity` and parses its JSON content to extract its `config` property. This configuration comes from `wp_interactivity_config` and is stored in the internal in-memory page cache entry.

**Merging server data during navigation**

When navigation renders the new page, the server-provided data may need to merge with the existing client-side state, depending on the use case. The key principle here is that **client-side state is never automatically overwritten by the server**. This design ensures that any changes your JavaScript code has made to the state (such as user preferences, UI toggles, or form input) are preserved across navigations.

For **global state**, the merge works as follows: properties that already exist on the client are left untouched, and only new properties (those that don't exist on the client yet) are added from the server data. If you need the client state to reflect server changes during navigation, use `getServerState()` to subscribe to the server-provided values and update the client state yourself.

```
Server state from the initial page:
  { "totalResults": 120, "isFiltersOpen": false }

Before navigation (User opened the filters, modifying client state):
  getServerState()  → { "totalResults": 120, "isFiltersOpen": false }
  state             → { "totalResults": 120, "isFiltersOpen": true }

Server state from the new page:
  { "totalResults": 85, "sortOrder": "date" }

After navigation:
  getServerState()  → { "totalResults": 85, "sortOrder": "date" }
  state             → { "totalResults": 120, "isFiltersOpen": true, "sortOrder": "date" }
```

`totalResults` stays at `120` in `state` because it already existed on the client. `isFiltersOpen` is also preserved. `sortOrder` is added because it didn't exist on the client yet. Meanwhile, `getServerState()` always reflects exactly what the server sent for the new page.

For **local context**, the behavior follows the same principle. The Interactivity API tracks server context and client context separately. During navigation, the server context is updated with the values from the new page, but the client context remains unchanged. Use `getServerContext()` to read the server-provided values and `getContext()` to read the client-side values, choosing whichever is appropriate for your use case.

```
Server context from the initial page:
  { "isAvailable": true, "isLiked": false }

Before navigation (User has liked the item, modifying client context):
  getServerContext() → { "isAvailable": true, "isLiked": false }
  getContext()       → { "isAvailable": true, "isLiked": true }

Server context from the new page:
  { "isAvailable": false, "discount": 15 }

After navigation:
  getServerContext() → { "isAvailable": false, "discount": 15 }
  getContext()       → { "isAvailable": true, "isLiked": true, "discount": 15 }
```

`isAvailable` stays `true` in `getContext()` because it already existed on the client. `isLiked` is also preserved. `discount` is added because it didn't exist on the client yet. Meanwhile, `getServerContext()` always reflects exactly what the server sent for the new page.

**Subscribing to server data changes**

The Interactivity API provides two functions for accessing server-provided data that updates during navigation:

-   `getServerState()`: Returns the global state as provided by the server for the current page
-   `getServerContext()`: Returns the local context as provided by the server for the current element

These functions are reactive. When used inside a callback or derived state getter, they automatically set up a subscription. When navigation occurs and new server data arrives, any code using these functions will re-run with the new values.

This is different from the regular `state` and `getContext()`, which return the client-side state and context. As explained above, existing client-side values are not overwritten during navigation, so `state` and `getContext()` will keep reflecting whatever the client had before navigating. Use `getServerState()` and `getServerContext()` when you need to react to the values that the server sent for the new page.

For more details, see the [Understanding global state, local context, and derived state](/docs/reference-guides/interactivity-api/core-concepts/understanding-global-state-local-context-derived-state-and-config.md#subscribing-to-server-state-and-context) guide.

### Putting it all together: the navigation flow

Now that we've examined each component, let's trace through a complete navigation to see how they work together.

#### Phase 1: Prefetch (optional but recommended)

When `prefetch()` is called (for example, on link hover):

1. The router normalizes the URL and checks the page cache.
2. If not cached, it begins fetching the HTML.
3. The fetched HTML is parsed into a document.
4. Router regions are extracted and converted to virtual DOM.
5. Style sheets are compared with the previously loaded ones; new ones are added with `media="preload"`.
6. Script modules are identified and compared with the previously loaded ones; new ones have their dependencies resolved and source code fetched.
7. Server state is extracted.
8. The fully processed page is stored in the cache.
9. The function returns (the page is now ready for instant navigation).

#### Phase 2: Navigate

When `navigate()` is called (for example, on link click):

1. The router checks if client navigation is disabled; if so, falls back to full page load. Nothing below happens, and no lifecycle transition is published.
2. The navigation's start is published: `state.navigating` and `state.initiator` are written together in a single batch. This is the first moment the navigation is observable to anyone. It happens in the same synchronous step that kicks off the fetch below, before any waiting, and nothing gates, debounces or delays it.
3. If not already prefetched, the fetch process from Phase 1 runs now.
4. The router waits for the page to be ready (fetch complete, styles loaded).
5. A loading indicator may appear if the wait exceeds a threshold (400ms), together with a "loading" announcement for screen readers. That threshold gates only this built-in feedback and the deprecated `state.navigation` flags — it does **not** gate `state.navigating`, which has read truthy since step 2 no matter how fast the navigation is.
6. The rendering phase begins:
    - Styles are activated/deactivated as needed.
    - Script modules for the new page are executed.
    - In a batch for efficiency:
        - Server state is merged with client state.
        - Each router region is updated with its new virtual DOM.
        - Regions with `attachTo` that don't exist are created and appended.
    - The document title is updated.
7. Browser history is updated (pushState or replaceState).
8. Screen reader announcement is made for accessibility.
9. If the URL has a hash, the page scrolls to that element.
10. Navigation is complete.
11. On a later frame, after the commit in step 6 has landed in the DOM, the navigation's end is published: `state.navigating` is set back to `false`. This is later than it looks — `navigate()`'s own promise has already resolved by then. `state.initiator` is not cleared here; it keeps the finished navigation's value until the next navigation's start replaces it.

Steps 2 and 11 are the two lifecycle writes. [The navigation lifecycle keys](#the-navigation-lifecycle-keys) covers what a consumer can rely on about them, including why the end is published on a later frame instead of inside step 6.

#### Race condition protection

A subtle but important detail: users don't always wait for navigation to complete before clicking another link. The router handles this gracefully.

When `navigate()` is called, the router remembers the target URL. If another `navigate()` call comes in before the first completes, the router updates its target and the first navigation is abandoned. When the first navigation's fetch completes, it checks whether its URL is still the current target — if not, it simply returns without rendering.

This ensures that rapid clicking through multiple links doesn't cause visual glitches or render stale content. Only the most recent navigation completes.

The lifecycle keys follow the same latest-wins rule, which is what a loading indication needs. From the first navigation's start through the winning navigation's end, `state.navigating` reads truthy **continuously**: an abandoned navigation leaves no idle gap in the middle and publishes no end of its own, so an indicator bound to it never blinks off between two clicks, and a callback watching for the end runs once, when the winner finishes. `state.initiator` always identifies the most recent navigation, so a region whose navigation has been superseded by another region's stops reading as the origin at the moment it is superseded.

The lifecycle writes are not governed by the target-URL comparison described above; the end write carries a latest-wins check of its own. That is what stops an abandoned navigation from publishing an end while the winner is still in flight, and it holds for every way one navigation can supersede another, including a Back press landing mid-navigation. [Overlapping navigations](#overlapping-navigations) states the contract a consumer can rely on.

## Full-page client-side navigation (experimental)

Full-page client-side navigation is an experimental feature that extends the region-based approach described throughout this guide. Instead of requiring you to define individual router regions, full-page navigation treats the entire `<body>` element as a single region — effectively replacing all page content during navigation.

This feature is only available in the Gutenberg plugin and must be enabled manually. To activate it, go to **WP Admin > Settings > Gutenberg Experiments** and check the **"Interactivity API: Full-page client-side navigation"** option.

Once enabled, this mode automatically intercepts all link clicks and hover events on the page, triggering client-side navigation and prefetching without you needing to write any custom action handlers. It is available through a separate entry point in the router package:

```js
import '@wordpress/interactivity-router/full-page';
```

Full-page client-side navigation is essentially a special case of region-based navigation where there is only one region covering the whole page. Because it replaces all content, **every interactive element on the page must use the Interactivity API** (not jQuery or other libraries) for client-side navigation to work correctly.

<div class="callout callout-alert">
This feature is experimental and still under active development. It may not work correctly in all scenarios. If you try it out, please report any issues you encounter in the <a href="https://github.com/WordPress/gutenberg/issues">Gutenberg GitHub repository</a>. Contributions are also welcome!
</div>
