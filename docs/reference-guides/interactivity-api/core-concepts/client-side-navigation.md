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

The pattern above only runs for navigations this action started. To cover every other navigation that publishes a lifecycle cycle — such as another link inside the same region or a cache-served back/forward traversal whose entry resolves truthy — react to the end of the navigation instead, with a watcher on the router's `state.navigating` property. An uncovered traversal (an uncached destination or a cached entry that resolves falsy) reloads the document without a lifecycle cycle of its own: from idle, the watcher does not run for it, and when it discharges a displaced reading, the watcher sees that discharge rather than a traversal cycle. Such a watcher runs slightly later than the code after the `yield` above, because `state.navigating` is updated on a later frame than the one in which `actions.navigate()` resolves. See [Region-scoped focus after navigation](#region-scoped-focus-after-navigation) for the watcher, and [Reacting to the navigation lifecycle](#reacting-to-the-navigation-lifecycle) for the properties it reads.

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

**Example: Modal that appears on navigation:**

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

During client-side navigation, the router uses a virtual DOM diffing algorithm to update the content inside router regions. This algorithm relies on heuristics to efficiently match elements between the current and target pages. These heuristics work well for most cases, but they can fail under certain conditions — for example, when two elements have the same type and position on different pages but use different directives. In such cases, the algorithm may incorrectly treat them as the same element, leading to corrupted state or broken behavior.

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

That syncing does not happen on its own. When the router loads a page, it merges that page's server data into the client state _without overriding_: a key that already exists keeps its value, and only new keys are added. This lets blocks that first appear on the new page initialize from the server without discarding changes the visitor made on the current one, but it also means that a binding reading a server-seeded key keeps showing the value the first page seeded, on every later navigation, unless you re-sync it yourself.

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

The `core/router` store exposes a reactive `state.url` property that holds the current page's URL. By reading this value inside a `data-wp-watch` or `watch` callback, you create a reactive subscription that re-runs when the URL changes. The router assigns the value in the commit batch that renders a client-side destination and when it renders a cache-served back/forward traversal. A same-URL assignment—such as the `navigate( window.location.href, { force: true } )` refresh pattern—doesn't change the value, so it doesn't notify subscribers. A navigation that falls back to a full page load commits no destination and leaves `state.url` at the source page's URL. Use the lifecycle keys below for work that must react to every covered navigation.

```js
// view.js
import { watch, store } from '@wordpress/interactivity';

const { state: routerState } = store( 'core/router' );

// Store-wide subscription.
watch( () => {
	sendAnalyticsPageView( routerState.url );
} );

// Element-based subscription: <div data-wp-watch="callbacks.sendPageView">
store( 'myPlugin', {
	callbacks: {
		sendPageView() {
			sendAnalyticsPageView( routerState.url );
		},
	},
} );
```

<div class="callout callout-info">
Blocks can read the `core/router` store without importing the `@wordpress/interactivity-router` package. When the router module evaluates, it initializes `state.url` from the current location unless the server has already seeded it. If the module never loads, `state.url` is `undefined`; see [The navigation lifecycle keys](#the-navigation-lifecycle-keys) for the router-absent behavior.
</div>

## Reacting to the navigation lifecycle

`state.url` tells you where a navigation ended up. Two more reactive properties on the same `core/router` store tell you whether a navigation is in progress and who started it. Together they let a block show its own loading indicator, move focus after a navigation it did not start, or ignore back/forward traversals.

### The navigation lifecycle keys

-   **`state.navigating`** — truthy while a client-side navigation is in progress.
-   **`state.initiator`** — a string identifying who started the current navigation, or `null` when nobody identifiable did.

Neither property is declared when the router registers its store, so before the first client-side navigation both read `undefined`. You get the same `undefined` on a page where the router module has not loaded, or never loads at all, which means a block asking "is a navigation in progress?" gets the right answer on every page.

<div class="callout callout-info">
Check these properties by truthiness: write <code>if ( state.navigating )</code> and <code>state.initiator === myRegionId</code>, not <code>state.navigating === false</code> or <code>state.initiator === null</code>. Each has two idle values — the <code>undefined</code> before the router has ever run, and the <code>false</code> or <code>null</code> it writes afterwards.
</div>

For the exact types and edge cases, see the [`core/router` state reference](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-interactivity-router/#state).

### When the keys change

**When a navigation starts**, the router resolves the initiator for the call, then calls `actions.prefetch()` for the destination. That prefetch starts the destination fetch, and the router sets `state.navigating` and `state.initiator` together, in a single batch, before the navigation yields to wait for the page. The start is synchronous with the call: it doesn't wait for the fetch or the page, and the fetch may already be in flight when the start pair is published. This happens for every client-side navigation, however fast: the 400ms delay described in [Disabling navigation feedback](#disabling-navigation-feedback) only applies to the built-in loading animation and screen reader announcement, and the `loadingAnimation` and `screenReaderAnnouncement` options do not affect these properties either. A navigation to the URL you are already on, like the `navigate( window.location.href, { force: true } )` refresh pattern, counts too.

**When a navigation ends**, the router sets `state.navigating` back to `false`. By then the new content is normally already in the DOM and `state.url` already holds the destination URL; the two exceptions are described in [When a navigation ends without new content](#when-a-navigation-ends-without-new-content) below. The update happens on a later frame than the DOM commit (the moment the new content is applied to the real DOM), so that even a very fast navigation produces two separate updates rather than a single one that only shows the finished state. How much later is not specified, so treat it as "some time after the content is committed". In particular, the promise returned by `actions.navigate()` resolves before this update, so code like `yield actions.navigate( url ); if ( state.navigating ) { … }` still sees `state.navigating` as truthy. To react to the end of a navigation, use a watcher instead.

`state.initiator` is **not cleared** when a navigation ends. It keeps the value of the last navigation until the next one starts, so a watcher reacting to the end can still read who started it. A back/forward traversal clears it instead — at the claim for any cached traversal, or at the reload exit for an uncached traversal — as described in [Which navigations update the keys](#which-navigations-update-the-keys). This also means that a condition like `! state.navigating && state.initiator === myRegionId` stays true for as long as the page is idle afterwards, not only at the moment the navigation ends. React to the change itself rather than to the condition being true; the [focus recipe](#region-scoped-focus-after-navigation) below shows how.

### When a navigation ends without new content

Normally, when `state.navigating` becomes `false` the new content is already in the DOM. Two cases break that rule:

-   **The router threw while rendering the new page.** `state.navigating` is still set to `false` on a later frame, so it does not stay truthy forever. `state.url` already holds the destination URL, but the regions may still contain their old content, be partially updated, or be absent.
-   **The navigation fell back to a full page load.** A failed fetch, a non-200 response, an unparseable response, the navigation timeout, or a destination page whose configuration disables client-side navigation all make the router hand the navigation to the browser, which then replaces the document. Nothing was rendered, and `state.url` still holds the URL of the page you were on. `state.navigating` stays truthy while the browser replaces the document. If the document is still there 10 seconds after the fallback began — the visitor declined an unload prompt, say, or the reload is very slow — the router stops waiting and sets `state.navigating` to `false`. That is not an error report: it only means that nothing is in progress any more. The 10 seconds are measured on the page's own timers, so a backgrounded tab may run the reset later, and they are unrelated to `navigate()`'s `timeout` option, which happens to default to 10 seconds too.

In both cases `state.initiator` keeps the navigation's value, as it does after any other navigation.

So a callback that touches the DOM when a navigation ends should look the elements up inside the callback and check that they exist, rather than assume the destination page is there. A callback that only reads store state is unaffected.

### Which navigations update the keys

Both properties are updated for:

-   Every `actions.navigate()` call that results in a client-side navigation, from any call site and with any options: an action bound to a directive, code that imported the router itself, or the document-level click listener of full-page mode.
-   Every back/forward traversal that the router serves from its in-memory cache.

No navigation starts for:

-   A `navigate()` call on a page where [client-side navigation is disabled](#disabling-client-side-navigation-on-certain-pages). The router hands the navigation to the browser before doing any client-side work.
-   A back/forward traversal to a page that is not in the in-memory cache, or whose cached fetch had failed, which causes a full page reload. When neither a navigation nor a retained initiator exists, it writes nothing. If either is present, the traversal clears the readable values: an uncached traversal does so at the reload exit, while a cached-falsy traversal clears a retained initiator at the claim and any in-flight navigation at the reload exit, so no stale value survives the traversal.
-   `actions.prefetch()`. Prefetching is not navigating.

**A failed navigation is never reported as a successful one.** When a navigation starts client-side and then falls back to a full page load, `state.navigating` becomes truthy, nothing is rendered, and `state.url` keeps the URL of the page you were on. `state.navigating` stays truthy while the browser replaces the document, and is set to `false` only if the document is still there 10 seconds later, as described in [When a navigation ends without new content](#when-a-navigation-ends-without-new-content). The promise returned by `navigate()` never resolves in that case either.

### Overlapping navigations

The router is latest-wins (see [Race condition protection](#race-condition-protection)), and so are these properties. If a second navigation starts before the first one ends, `state.navigating` stays truthy from the first start until the winning navigation ends, with no idle gap in between and no second "end" when the abandoned navigation finishes. When the winner ends, `state.navigating` becomes `false` once. The 10-second limit described in [When a navigation ends without new content](#when-a-navigation-ends-without-new-content) applies here too: if the winning navigation is a back/forward traversal whose cached page fetch has still not settled after 10 seconds, the router sets `state.navigating` to `false` rather than leaving it truthy indefinitely. If that cached entry settles after the release, a truthy page starts a fresh cycle: `state.navigating` rises again, `state.initiator` reads `null` in the start pair, and the ordinary end follows. A falsy result takes the reload exit instead and publishes no cycle of its own.

`state.initiator` always identifies the most recent navigation. The moment a second navigation starts it replaces the first one's value, including with `null` when the second navigation has no identifiable initiator. A back/forward traversal that arrives while a navigation is in progress does exactly that: it takes over and clears the initiator. A cached traversal also clears an identity retained from a completed navigation at its claim, before waiting for its entry.

For a per-region loading indicator this is the behavior you want, with no bookkeeping of your own: a region whose navigation is superseded by another region's stops showing as the initiator at that moment, and two overlapping navigations from the same region keep that region showing as the initiator until the last of them ends.

### Who initiated the navigation

`actions.navigate()` accepts an `initiator` option with four cases:

```js
// Derive it from where the call was made (the default).
yield actions.navigate( url );

// Set it explicitly.
yield actions.navigate( url, { initiator: 'myPlugin/cart' } );

// Suppress attribution.
yield actions.navigate( url, { initiator: null } );
```

-   **A nonempty string** is stored in `state.initiator` as is, and no region lookup happens. Use this to give a block an identity of its own that other code can read, including code in a different store that does not own the action that navigated.
-   **`null`** leaves `state.initiator` as `null` for the whole navigation, even when the call was made from inside a router region.
-   **Omitted** derives the initiator from where the action was called: the nearest element with `data-wp-router-region` that encloses the element whose directive called the action, including that element itself. When regions are nested, the nearest one wins: the outer region is still what the router updates, but the inner region is what started the navigation.
-   **An empty string or any other invalid value** resolves to `null`, logs a warning when `SCRIPT_DEBUG` is enabled, and never falls back to deriving the initiator.

A derived initiator is the region's ID as you wrote it, not the raw attribute text: for the JSON object form used in [Adding new regions on navigation](#adding-new-regions-on-navigation) it is the value of `id`, and a `namespace::` prefix is stripped. An empty or non-string `id` in that object form derives `null`; a malformed but nonempty attribute value remains its raw post-prefix string. See the [`initiator` option reference](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-interactivity-router/#navigate) for the exact rules.

### Navigations with no initiator

`state.initiator` is `null` when:

-   **The visitor used the browser's back or forward button.** A cache-served traversal whose entry resolves truthy writes `state.initiator` as `null` in its start pair. An uncached traversal, or a cached entry that resolves falsy, reloads the document without publishing a lifecycle cycle of its own: from pristine idle it writes nothing, so both keys stay `undefined`; if it displaces an in-flight navigation or a retained identity, it discharges the reading as reload starts, ending any in-flight reading with `state.navigating = false` and clearing a retained identity to `null` (a cached-falsy entry clears that identity at its claim). No block started the navigation, which is what lets a block tell a traversal apart from a navigation it started itself.
-   **A link was handled by the document-level listener of full-page mode**, wherever the link sits. A plain link inside a block's region was not started by that block.
-   **`navigate()` was called with no directive scope**, for example from a module that imports the router and calls it from its own code rather than from an action bound to an element.
-   **`navigate()` was called from inside an unwrapped `watch()` that reacts to `state.navigating`, `state.initiator` or `state.url`.** That callback runs without a directive scope, so the call does not inherit the initiator of the navigation it is reacting to. A callback wrapped with `withScope()` deliberately reinstalls its captured scope and can derive that region instead. A `data-wp-watch` reacting to the same change runs a frame later and derives its own region as usual.

In full-page mode, the `<body>` element itself carries `data-wp-router-region="core/body"`, so an element with a directive that calls `navigate()` from outside every block's router region derives `core/body`, where the same markup in region-based mode derives `null`. See [Full-page client-side navigation](#full-page-client-side-navigation-experimental).

### Telling which region started a navigation

There is no per-region flag; combine the two properties:

```js
const startedHere = state.navigating && state.initiator === myRegionId;
```

A derived initiator identifies the region, not the element: two blocks inside the same router region get the same initiator, and it alone cannot tell them apart. When you need to, give each instance its own router region or pass an explicit `initiator`. A block that already renders one router region per instance, say `myPlugin/gallery-1` and `myPlugin/gallery-2`, needs neither: each instance derives its own ID, so two copies on one page are already distinguishable.

### Choosing where to read the keys

Where you read the two properties decides when your code runs and what it can see:

-   **`data-wp-watch`** runs in the element's directive scope, so `getContext()` and `getElement()` are available inside it. It is deferred by a frame and coalesces changes landing within the same frame. For a navigation that reaches its content commit, a callback reacting to its end sees the newly committed destination DOM. An end reached without that commit — because the navigation terminates exceptionally before or during the commit, or because a mid-flight fallback's release returns the reading to idle — publishes no destination content, so the callback may observe old, partially updated, or absent content and can't assume a committed destination. Derived state getters evaluated through a directive run in that element's scope too.
-   **`watch()`**, the utility from `@wordpress/interactivity`, runs **synchronously** at the moment a value changes. An unwrapped callback has **no directive scope** — `getContext()` and `getElement()` are not available inside it — while a callback wrapped with `withScope()` deliberately reinstalls its captured scope. Use an unwrapped watcher for page-level work that only touches store state. Because it runs synchronously, a `watch()` keyed on `state.url` runs before the new region content has been rendered and observes the _old_ DOM. When it is keyed on the end of a navigation that reaches its content commit, it runs after the commit and observes the new destination DOM. An end reached without that commit — because the navigation terminates exceptionally before or during the commit, or because a mid-flight fallback's release returns the reading to idle — publishes no destination content, so the callback may observe old, partially updated, or absent content and can't assume a committed destination. See the [`watch()` reference](/docs/reference-guides/interactivity-api/directives-and-store.md#watch).
-   **`data-wp-init`** runs in scope once per element, which makes it the place for setup that belongs to hydration rather than to a navigation.

"The new DOM" above applies only to a navigation that reaches its content commit. An end reached without that commit — because the navigation terminates exceptionally before or during the commit, or because a mid-flight fallback's release returns the reading to idle — promises no destination content, so a callback reacting to it may find old, partially updated, or absent content. Look elements up inside the callback and check that they exist.

### Recipes

#### Per-block loading indicator

To show that a specific block is loading, combine the two properties in a derived state getter and bind it through a getter. Unlike a flag that your own action sets around its `actions.navigate()` call, this covers navigations started by any link or action inside the region, can be scoped to one region rather than to every instance of the block, and can be read from any store, not only the one that owns the action.

```js
// view.js
import { store } from '@wordpress/interactivity';

// The `core/router` store is available without importing the router package.
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

**One region per instance, with its ID in the context.** When the same block appears more than once on a page and each copy needs its own indicator, give each copy its own router region and write that ID into the block's context at render time:

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

You could instead find the ID inside the getter from the DOM, with `getElement().ref.closest( '[data-wp-router-region]' )`, but reading it from the context hands the getter a value the block already knew when it rendered, with no DOM walk on every evaluation and no need to reimplement the ID normalization described above.

On the initial page load both properties read `undefined`, so the getter returns `false` and the indicator stays hidden. On a back/forward traversal `state.initiator` is never your region's ID, so the indicator stays hidden too: a traversal is not something your block started.

#### Region-scoped focus after navigation

[Handling scroll and focus](#handling-scroll-and-focus) moves focus inside the navigating action, after the `yield`, which only covers navigations that action started. To move focus after any navigation started from inside a region, and to explicitly leave back/forward traversals alone, put a `data-wp-watch` inside the region, act when `state.navigating` changes from truthy to falsy, and only when `state.initiator` is that region's own ID:

```js
// view.js
import { getContext, store } from '@wordpress/interactivity';

const { state: routerState } = store( 'core/router' );

// The previous `navigating` value, per region. See the two notes below for
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
				// Looked up after the navigation ends, never captured
				// before it: a navigation that reaches its content commit
				// has its destination content in the DOM by this point.
				// An end without that commit promises no destination content
				// and may leave old, partially updated, or absent content.
				// The `?.` covers a target that isn't there.
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

The watcher lives on its own element inside the region, and the region's ID reaches it through the same context line the per-instance example above uses:

```html
<div
	data-wp-interactive="myPlugin"
	data-wp-router-region="myPlugin/gallery-1"
	data-wp-context='{ "regionId": "myPlugin/gallery-1" }'
>
	<span data-wp-watch="callbacks.focusAfterNavigation"></span>
</div>
```

If the region ID is a literal you wrote by hand, drop the `getContext()` line and compare against that literal.

**React to the change, not to the condition.** `state.initiator` keeps its value after a navigation ends (see [When the keys change](#when-the-keys-change)); a traversal clears it separately, so a callback that checks `! state.navigating && state.initiator === regionId` would move focus again on every later re-run. Comparing against the previous value makes it act exactly once, when the navigation ends.

**Keep the bookkeeping out of `context`.** A callback that both reads and writes the same value through the reactive `context` proxy subscribes itself to its own write and re-triggers. The previous `navigating` value is bookkeeping, not something the page renders, so a plain module-scope object is the right home for it.

**Keep the bookkeeping off the region element too.** A navigation can tear the region's DOM down and rebuild it while your module stays loaded, so anything stored on the element itself does not survive the very navigation it is trying to measure. A module-scope object keyed by region ID does, and one object serves every region on the page.

**Capture no DOM reference across the navigation.** Look up the focus target after the falling edge, not before it. For a navigation that reaches its content commit, the end is published after the destination content is in the DOM, so the lookup finds the new page's element. An end reached without that commit promises no destination content and may leave the lookup against old, partially updated, or absent content. The `?.focus()` guard handles a target that isn't there.

On the initial page load the callback runs once at hydration, reads `state.navigating` as `undefined`, records `false` and does nothing. On a cache-served back/forward traversal whose entry resolves truthy, the start pair sets `state.initiator` to `null`, so the comparison fails and focus stays where the browser put it. An uncached traversal, or a cached entry that resolves falsy, publishes no lifecycle cycle for the callback to see: from idle, the callback does not re-run, and when the traversal discharges a displaced in-flight reading or a retained identity, the callback observes the discharge and the comparison still fails. Focus therefore stays where the browser put it, which is usually what a visitor who pressed Back expects.

#### Debounced page-level loading bar

The router's built-in loading animation appears only if the navigation is still in progress after 400ms, so a prefetched or cached navigation never flashes a bar at the visitor. If you disable that animation and draw your own (see [Disabling navigation feedback](#disabling-navigation-feedback)), reproduce the delay rather than binding a bar straight to `state.navigating`: start a timer when `state.navigating` becomes truthy, clear it when it becomes falsy. This is page-level work that only touches store state, so use `watch()` rather than a `data-wp-watch`:

```js
// view.js
import { store, watch } from '@wordpress/interactivity';

const { state: routerState } = store( 'core/router' );

const { state } = store( 'myPlugin', {
	state: {
		// This store's own state, declared with an idle default. Unlike the
		// router's two properties, it is not a passthrough of anything.
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

The callback reads `state.navigating` and nothing else, so it re-runs only when that property changes, which is what keeps the timer from being started twice. Three things follow from that, and none of them needs bookkeeping of your own:

-   **Overlapping navigations start the timer once.** `state.navigating` stays truthy from the first start until the winning navigation ends (see [Overlapping navigations](#overlapping-navigations)), so a double click does not restart the delay or flicker the bar.
-   **A navigation that falls back to a full page load can release the bar before the document is replaced.** `state.navigating` stays truthy while the browser replaces the document, but the lifecycle release returns the reading to idle at its 10-second bound even if the document has not been replaced — a slow replacement is indistinguishable from a declined unload (see [When a navigation ends without new content](#when-a-navigation-ends-without-new-content)). The watcher then clears the timer and hides the bar. The release is a bound on how long this page reports in progress, not a failure signal or proof that the replacement will not happen.
-   **A cache-served traversal whose entry resolves truthy publishes a lifecycle cycle.** It usually finishes inside the 400ms window, so no bar appears. An uncached traversal or a cached entry that resolves falsy publishes no cycle of its own: from idle, `state.navigating` never rises, so the watcher never arms the timer; if the traversal discharges a displaced in-flight claim, the reading falls to idle and the watcher takes its `else` branch. The traversal produces no bar.

On the initial page load `state.navigating` is `undefined`, so the first run takes the `else` branch and does nothing.

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

**Defining router regions:**

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

**How regions are processed during page fetch:**

When the router fetches a new page (either through `prefetch()` or as part of `navigate()`), it processes the HTML to extract and prepare all router regions. This happens in several steps:

First, the router parses the fetched HTML into a document structure using the browser's built-in HTML parser. This gives it a complete DOM tree to work with, just as if the page had been loaded normally.

Next, the router scans this document for all elements that have both `data-wp-interactive` and `data-wp-router-region` attributes. For each region found, it extracts the region ID and checks whether the region is nested inside another region. Only top-level regions are processed directly; nested regions are handled as part of their parent's content.

For each top-level region, the router converts the HTML into a virtual DOM (vDOM) representation. The virtual DOM is a lightweight JavaScript object structure that mirrors the actual DOM but can be compared and manipulated much more efficiently by the Interactivity API. Importantly, the region element itself is included in this conversion — not just its children. This means that attributes on the region element, such as `data-wp-context`, will also be processed and updated during navigation.

Finally, each region's virtual DOM is stored in the page cache entry, indexed by its region ID. The cache entry now contains a map of region IDs to their corresponding virtual DOM trees.

Beyond processing regions, the router also extracts the page's CSS stylesheets and JavaScript script modules during this step. New stylesheets that haven't been loaded yet are added to the document in a disabled state so the browser can begin downloading them without applying them. Similarly, new script modules are identified and their dependency trees are resolved and fetched. These assets are prepared in advance so that when navigation actually renders the new content, all necessary styles and scripts are ready. The details of how styles and script modules are handled are covered in the [CSS handling](#css-handling) and [Script module handling](#script-module-handling) sections below.

**How regions are rendered during navigation:**

When `navigate()` is called and the target page has been successfully fetched (or was already cached), the router needs to update the current page to show the new content. This rendering process is carefully orchestrated to be efficient and avoid visual glitches.

The router begins by examining which regions exist in the current page and which exist in the target page. Based on this comparison, three different scenarios can occur:

**Scenario 1: Region exists on both pages (update):**

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

**Scenario 3: Region exists only on the current page (remove):**

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

**The challenge of CSS cascade order:**

CSS rules are applied in a specific order, and when two rules have the same specificity, the one that appears later in the document "wins." This means that the order of `<link>` and `<style>` elements in your HTML matters. If the router simply appended new style sheets to the end of the document, it could inadvertently change which rules take precedence, causing visual bugs.

Consider this example: Page A has style sheets `base.css` and `theme.css`, and Page B has `base.css`, `components.css` and `theme.css`. If the user navigates from A to B, the router needs to insert `components.css` between `base.css` and `theme.css` — not at the end. Otherwise, any rules in `theme.css` that are meant to override `components.css` would stop working.

**How styles are extracted and prepared:**

When the router fetches a page, it extracts all style-related elements: both `<link rel="stylesheet">` tags and inline `<style>` blocks. Each style element is identified by a combination of its attributes (for `<link>` tags, primarily the `href`) or its content hash (for inline `<style>` blocks).

The router then compares the extracted styles with those already present in the current page's document. Styles fall into three categories:

1. **Already present**: The style sheet is already loaded in the current page. No action needed during preparation.
2. **New**: The style sheet doesn't exist in the current page. It needs to be added.
3. **No longer needed**: The style sheet is in the current page but not in the target page. It will be disabled during navigation.

**Preloading new styles without applying them:**

For new style sheets, the router faces a dilemma: it needs to ensure the styles are fully loaded before showing the new page content (to prevent flash of unstyled content), but it doesn't want to apply them yet (because the user is still viewing the current page).

The solution is to add new `<link>` elements with their `media` attribute set to a value that prevents them from applying. The router uses `media="preload"`, which tells the browser "this style sheet applies to no media types" — effectively disabling it while still allowing the browser to download and parse it.

When a `<link>` element is added this way, the browser begins downloading the CSS file immediately. The router tracks when each style sheet finishes loading by listening for the `load` event. This allows it to wait until all new styles are ready before proceeding with navigation.

**Maintaining cascade order with the Shortest Common Supersequence algorithm:**

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

**Activating and deactivating styles during navigation:**

When `navigate()` actually renders the new page, the router toggles style sheets on and off:

-   **Activating styles**: For each style sheet that belongs to the target page, the router restores the original `media` attribute (reverting the `media="preload"` override set during prefetching) and sets `sheet.disabled = false`. This causes the browser to apply those styles.

-   **Deactivating styles**: For each style sheet that was in the current page but not the target page, the router sets `sheet.disabled = true`. This disables the styles without removing the element from the DOM.

By keeping deactivated style elements in the DOM (rather than removing them), the router can quickly reactivate them if the user navigates back. The styles are already loaded and parsed; they just need to be re-enabled.

### Script module handling

The Interactivity API uses [script modules](https://make.wordpress.org/core/2024/03/04/script-modules-in-6-5/) for interactive behavior. The router must ensure that when navigating to a new page, the required script modules are loaded and executed.

**Identifying script modules for client-side navigation:**

Not all script modules should be loaded during client-side navigation. Some modules might be for admin functionality, or for features that only apply on initial page load. As described in the [Getting started](#getting-started-with-the-interactivity-router) section, WordPress uses the `data-wp-router-options` attribute to mark which script modules should be loaded during navigation:

```html
<script
	type="module"
	src="/wp-content/plugins/my-plugin/view.js"
	data-wp-router-options='{"loadOnClientNavigation": true}'
></script>
```

When the router fetches a page, it scans for all `<script type="module">` elements that have this attribute with `loadOnClientNavigation` set to `true`. These are the modules it will preload and execute.

**Processing the import map:**

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

**Preloading script modules and their dependencies:**

Preloading script modules requires resolving their full dependency tree, since a single entry-point module might depend on dozens of other script modules, which might depend on dozens more.

To handle this, the router performs a recursive dependency resolution:

1. It fetches the source code of each entry-point script module
2. It parses the source to find all `import` statements
3. For each import, it resolves the script module specifier using the import map
4. It recursively fetches and parses each dependency
5. This continues until all script modules in the dependency tree have been fetched

The router is smart about avoiding redundant work. If a script module has already been loaded by the initial page (it appears in the initial import map), the router doesn't fetch it again — the browser already has it cached.

**Handling the import timing:**

An important subtlety is that script module code shouldn't execute until navigation actually happens. The router needs to have the script module code ready (to avoid delays during navigation), but it shouldn't run that code while the user is still viewing the current page.

The router accomplishes this by transforming the fetched script modules. It rewrites the source code to use blob URLs (data embedded directly in the URL) and caches these transformed script modules. When navigation occurs, the router uses dynamic `import()` to execute the cached script modules.

Because the browser's module system caches script modules by URL, importing the same blob URL multiple times returns the same module instance. This ensures that each script module is only executed once, even if multiple code paths try to import it.

**Script module execution during navigation:**

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

**How server data is embedded in pages:**

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

**Extracting state, context and config during fetch:**

When the router fetches a new page, it extracts these types of server data:

1. **Global state**: The router finds the `<script type="application/json">` element with ID `wp-script-module-data-@wordpress/interactivity` and parses its JSON content to extract its `state` property. This state comes from `wp_interactivity_state` is stored in the internal in-memory page cache entry.

2. **Local context**: Context values are embedded in the virtual DOM representation of each router region. When a region's HTML is converted to vDOM, the `data-wp-context` attributes are preserved and will be processed during rendering.

3. **Config**: The router finds the `<script type="application/json">` element with ID `wp-script-module-data-@wordpress/interactivity` and parses its JSON content to extract its `config` property. This configuration comes from `wp_interactivity_config` and is stored in the internal in-memory page cache entry.

**Merging server data during navigation:**

When navigation renders the new page, the server-provided data may need to merge with the existing client-side state, depending on the use case. The key principle here is that **client-side state is never automatically overwritten by the server**. This design ensures that any changes your JavaScript code has made to the state (such as user preferences, UI toggles, or form input) are preserved across navigations.

For **global state**, the merge works as follows: properties that already exist on the client are left untouched, and only new properties (those that don't exist on the client yet) are added from the server data. If you need the client state to reflect server changes during navigation, use `getServerState()` to subscribe to the server-provided values and update the client state yourself.

```text
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

```text
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

**Subscribing to server data changes:**

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

1. The router checks if client navigation is disabled; if so, falls back to full page load without touching `state.navigating` or `state.initiator`.
2. The router records the target URL and calls `actions.prefetch()` for it. The prefetch reuses the Phase 1 cache check and begins fetching the page if it isn't already cached.
3. `state.navigating` and `state.initiator` are set together in a single batch, synchronously, before the navigation yields to wait for the page. The fetch may already be in flight when this start pair is published.
4. The router waits for the page to be ready (fetch complete, styles loaded).
5. A loading indicator may appear if the wait exceeds a threshold (400ms), together with a "loading" announcement for screen readers. That threshold only applies to this built-in feedback, not to `state.navigating`.
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
11. On a later frame, after the commit in step 6 has landed in the DOM, `state.navigating` is set back to `false`. `navigate()`'s own promise has already resolved by then. `state.initiator` is not cleared by this end write; it keeps its value until the next navigation replaces it or a traversal clears it.

Steps 3 and 11 are the two moments the lifecycle properties change. [Reacting to the navigation lifecycle](#reacting-to-the-navigation-lifecycle) covers what your code can rely on about them, including why the end is set on a later frame instead of inside step 6.

#### Race condition protection

A subtle but important detail: users don't always wait for navigation to complete before clicking another link. The router handles this gracefully.

When `navigate()` is called, the router remembers the target URL. If another `navigate()` call comes in before the first completes, the router updates its target and the first navigation is abandoned. When the first navigation's fetch completes, it checks whether its URL is still the current target — if not, it simply returns without rendering.

This ensures that rapid clicking through multiple links doesn't cause visual glitches or render stale content. Only the most recent navigation completes.

`state.navigating` and `state.initiator` follow the same latest-wins rule, but the update at the end of a navigation is not governed by the target-URL comparison described above: it carries a latest-wins check of its own. That is what stops an abandoned navigation from setting `state.navigating` to `false` while the winner is still in progress, and it holds for every way one navigation can supersede another, including a Back press landing mid-navigation. [Overlapping navigations](#overlapping-navigations) describes what your code can rely on.

## Full-page client-side navigation (experimental)

Full-page client-side navigation is an experimental feature that extends the region-based approach described throughout this guide. Instead of requiring you to define individual router regions, full-page navigation treats the entire `<body>` element as a single region — effectively replacing all page content during navigation.

This feature is only available in the Gutenberg plugin and must be enabled manually. To activate it, go to **WP Admin > Settings > Gutenberg Experiments** and check the **"Interactivity API: Full-page client-side navigation"** option.

Once enabled, this mode automatically intercepts all link clicks and hover events on the page, triggering client-side navigation and prefetching without you needing to write any custom action handlers. It is available through a separate entry point in the router package:

```js
import '@wordpress/interactivity-router/full-page';
```

Full-page client-side navigation is essentially a special case of region-based navigation where there is only one region covering the whole page. Because it replaces all content, **every interactive element on the page must use the Interactivity API** (not jQuery or other libraries) for client-side navigation to work correctly.

Full-page mode also changes what the [navigation lifecycle properties](#reacting-to-the-navigation-lifecycle) report. Links handled by its document-level listener set `state.initiator` to `null`, wherever the link sits. And because the `<body>` element itself carries `data-wp-router-region="core/body"`, an element with a directive of your own that calls `navigate()` from outside every block's router region derives `core/body` as its initiator, where the same markup in region-based mode derives `null`.

<div class="callout callout-alert">
This feature is experimental and still under active development. It may not work correctly in all scenarios. If you try it out, please report any issues you encounter in the <a href="https://github.com/WordPress/gutenberg/issues">Gutenberg GitHub repository</a>. Contributions are also welcome!
</div>
