# Client-Side Navigation

Client-side navigation is a technique that allows navigation between pages without requiring a full page reload. Instead of the browser fetching an entirely new HTML document from the server, client-side navigation fetches the new page's content and updates only the parts of the DOM that have changed. This results in faster, smoother page transitions and a more app-like user experience.

The Interactivity API provides client-side navigation through the `@wordpress/interactivity-router` package. This package enables you to implement region-based navigation, where only specific parts of your page are updated when navigating between URLs.

## How client-side navigation works

When a user triggers a navigation (for example, by clicking a link), the Interactivity Router:

1. **Fetches the new page**: The router requests the HTML of the destination URL.
2. **Parses the response**: It extracts the relevant regions, styles, scripts, and server-rendered data from the fetched HTML.
3. **Updates the DOM**: Only the content within designated "router regions" is replaced with the new content.
4. **Updates browser history**: A new entry is added to the browser's session history (or replaces the current entry if specified).
5. **Loads necessary assets**: Any new styles or script modules required by the new page are loaded before rendering.
6. **Handles accessibility**: Screen reader announcements are made to indicate navigation progress.

This approach offers several benefits:

- **Improved performance**: Only the changed parts of the page are updated, reducing data transfer and DOM manipulation.
- **Preserved state**: Client-side state (global state, local context) is preserved across navigations.
- **Smooth transitions**: No flash of white screen between pages; transitions feel instant and app-like.
- **SEO-friendly**: Since the server still renders complete HTML pages, search engines can crawl your site normally.

### In depth

This section explains the client-side navigation algorithm in more detail. You can skip to [Using the Interactivity API router](#using-the-interactivity-api-router) if you're more interested in practical usage.

#### Router regions

Router regions are the fundamental building blocks of client-side navigation. They define which parts of the page should be updated during navigation.

**How router regions are defined:**

Router regions are defined using the `data-wp-router-region` directive. The value can be either:

1. A simple string ID:
   ```html
   <div
	data-wp-interactive="myPlugin"
	data-wp-router-region="main-content"
   >
	<!-- Region content -->
   </div>
   ```

2. A JSON object with `id` and optional `attachTo` property:
   ```html
   <div
	data-wp-interactive="myPlugin"
	data-wp-router-region='{ "id": "my-modal", "attachTo": "body" }'
   >
	<!-- Region content -->
   </div>
   ```

The region ID must be unique within the page and consistent across pages that share the same region.

**Where router regions can appear:**

For a router region to work correctly:

1. **Must be inside an interactive element**: The element with `data-wp-router-region` must either have `data-wp-interactive` or be a descendant of an element with `data-wp-interactive`.

2. **Must have a unique ID**: The region ID must be unique within the page and consistent across pages that should share the same region.

3. **Nested regions should include `data-wp-interactive`**: When adding `data-wp-router-region` to a child element inside a parent with `data-wp-interactive`, always include `data-wp-interactive` on the child element as well.

```html
<!-- Correct: Region has data-wp-interactive -->
<div data-wp-interactive="myPlugin">
	<div
		data-wp-interactive="myPlugin"
		data-wp-router-region="sidebar"
	>
		<!-- Sidebar content -->
	</div>
</div>

<!-- Incorrect: Region without data-wp-interactive won't be updated -->
<div data-wp-router-region="sidebar">
	<!-- This won't work! -->
</div>
```

**How regions are handled:**

_During fetch (`prefetch()` or `navigate()`):_

1. **Regions are identified**: The router scans the fetched HTML for all elements with `data-wp-router-region`.
2. **Regions are converted to virtual DOM**: Each region's HTML (including the region element itself) is converted into a virtual DOM representation. This means directives on the region element, such as `data-wp-context`, will also be processed and updated during navigation.
3. **Regions are cached**: Each region is stored in the page cache with its corresponding ID.

_On `navigate()`:_

1. **Regions are located in the current page**: The router finds all existing regions by their IDs.
2. **Existing regions are updated**: If a region exists in both the current page and the target page, its content is updated with the new virtual DOM using Preact's diffing algorithm.
3. **New regions with `attachTo` are created**: If a region exists in the target page but not the current page, and it has an `attachTo` selector, the region is created and appended to the specified element.
4. **Orphaned regions are removed**: Regions that exist only in the current page are removed from the DOM.

#### CSS handling

The router carefully manages style sheets during navigation to ensure pages are styled correctly while minimizing network requests and avoiding flash of unstyled content.

**On `prefetch()`:**

1. **Styles are extracted**: The router extracts all `<link rel="stylesheet">` and `<style>` elements from the fetched HTML.
2. **Styles are compared**: Extracted styles are compared with those already present in the current page.
3. **New styles are added**: Style sheets that don't exist in the current page are added to the document with `media="not all"` (for `<link>` elements) so they are loaded but not applied yet. The router uses a [Shortest Common Supersequence](https://en.wikipedia.org/wiki/Shortest_common_supersequence) algorithm to add new style sheets while preserving CSS cascade order.
4. **Styles are recorded**: Both existing and newly added styles related to this page are recorded for later activation.

**On `navigate()`:**

1. **Styles are toggled**: The router enables or disables style sheets based on whether they belong to the page being navigated to:
   - Styles needed by the new page have their `media` attribute restored (enabled).
   - Styles not needed by the new page have their `media` attribute set to `not all` (disabled).

This approach ensures that:
- Style sheets are only loaded once, even if multiple pages use them.
- CSS cascade order is maintained correctly.
- Styles are ready before the page renders, preventing flash of unstyled content.

#### Script module handling

Script modules (ES modules loaded via `<script type="module">`) are managed to ensure all necessary JavaScript is available for the new page's interactive features.

**On `prefetch()`:**

1. **Script modules are located**: The router identifies script modules in the fetched HTML that should be loaded during client-side navigation. These are marked with `data-wp-router-options='{"loadOnClientNavigation": true}'`.
2. **Import map is processed**: The import map from the fetched page is parsed to resolve module dependencies.
3. **Modules are fetched and cached**: Script modules and their dependencies are fetched and cached by the browser's module system.

**On `navigate()`:**

1. **Cached modules are imported**: The router imports the cached script modules using dynamic `import()`.
2. **Modules are evaluated**: Each module is evaluated, initializing any stores or callbacks it contains.
3. **Deduplication is automatic**: Because modules are cached by the browser, importing the same module multiple times returns the cached version, ensuring each module is only evaluated once.

#### Server state and context

Server-rendered state and context are preserved and synchronized during navigation to maintain consistency between server and client.

**On `prefetch()`:**

1. **Global state is extracted**: Server state (from `wp_interactivity_state()`) is extracted from the fetched HTML.
2. **Local context is extracted**: Context values (from `data-wp-context` attributes) are extracted as part of each router region's virtual DOM.
3. **Data is cached**: Both state and context are stored in the page cache.

**On `navigate()`:**

1. **State and context are merged**: The server-provided state and context from the target page are merged with the existing client state.
2. **Reactive updates occur**: Components subscribed to the state or context will automatically re-render.
3. **Use `getServerState()` and `getServerContext()`**: To react to server-provided changes specifically, use these functions in your callbacks. See the [Understanding global state, local context and derived state](/docs/reference-guides/interactivity-api/core-concepts/undestanding-global-state-local-context-and-derived-state.md#subscribing-to-server-state-and-context) guide for details.

## Getting started with the Interactivity Router

The `@wordpress/interactivity-router` package is bundled with WordPress Core since version 6.5. To use it in your interactive blocks, you need to:

1. **Add the dependency**: Ensure `@wordpress/interactivity-router` is listed as a dependency for your script module.
2. **Define router regions**: Mark the HTML elements that should be updated during navigation.
3. **Trigger navigation**: Use the `actions.navigate()` function to navigate programmatically.

### Setting up router regions

First, define router regions in your block's markup:

```php
// render.php
<div
    <?php echo get_block_wrapper_attributes(); ?>
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

### Implementing navigation

Use `navigate()` to handle link clicks:

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

```html
<a
    data-wp-on--click="actions.navigateTo"
    href="/page-2/"
>
    Go to Page 2
</a>
```

_Note: The `withSyncEvent()` wrapper is required for actions that need to call synchronous event methods like `event.preventDefault()`. See the [withSyncEvent() documentation](/docs/reference-guides/interactivity-api/directives-and-store.md#withsyncevent) for details._

### Implementing prefetching

Use `prefetch()` to load pages before navigation:

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

```html
<a
    data-wp-on--mouseenter="actions.prefetchPage"
    data-wp-on--click="actions.navigateTo"
    href="/page-2/"
>
    Hover to prefetch, click to navigate
</a>
```

### Complete example: Pagination

Here's a complete example implementing client-side pagination:

**PHP (render.php):**
```php
<?php
$current_page = isset( $_GET['paged'] ) ? absint( $_GET['paged'] ) : 1;
$query = new WP_Query( array(
    'paged'          => $current_page,
    'posts_per_page' => 5,
) );
?>

<div
    <?php echo get_block_wrapper_attributes(); ?>
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

**JavaScript (view.js):**
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

### Adding new regions on navigation

The `attachTo` option allows router regions to be dynamically added to the DOM when navigating to a page where they exist, even if they weren't present on the original page. This is useful for modals, sidebars, or other UI elements that appear only on certain pages.

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

### Handling server state updates

During client-side navigation, the client-side state persists while the server provides new state for the target page. Use `getServerState()` and `getServerContext()` to react specifically to server-provided values.

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

            // Update client state with server values selectively.
            if ( serverState.productCount !== undefined ) {
                state.productCount = serverState.productCount;
            }

            if ( serverContext.isExpanded !== undefined ) {
                context.isExpanded = serverContext.isExpanded;
            }
        },
    },
} );
```

For more details, see the [Understanding global state, local context and derived state](/docs/reference-guides/interactivity-api/core-concepts/undestanding-global-state-local-context-and-derived-state.md#subscribing-to-server-state-and-context) guide.

### Overriding cached pages

By default, once a page is cached, subsequent navigations use the cached version. Use the `force` option to re-fetch a page even if it's cached:

```js
// Force re-fetch with navigate()
yield actions.navigate( '/products/', { force: true } );

// Force re-fetch with prefetch()
yield actions.prefetch( '/products/', { force: true } );
```

**Important:** If you're using `force: true` to refresh a page after a mutation (POST, PUT, DELETE request), make sure the mutation has completed before navigating:

```js
store( 'myPlugin', {
    actions: {
        deleteAndRefresh: function* () {
            // Wait for the deletion to complete.
            yield fetch( '/api/items/123', { method: 'DELETE' } );

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
// Navigate with custom HTML
yield actions.navigate( '/custom-page/', {
    html: `
        <div data-wp-interactive="myPlugin" data-wp-router-region="myPlugin/content">
            <h1>Custom Content</h1>
            <p>This HTML was provided directly, not fetched.</p>
        </div>
    `,
} );

// Prefetch with custom HTML
yield actions.prefetch( '/custom-page/', {
    html: customHtmlString,
} );
```

This is useful for:
- Optimistic UI updates where you construct the expected HTML before the server responds.
- Offline scenarios where you provide cached or fallback content.
- Testing and development.

### Managing browser history

By default, `navigate()` adds a new entry to the browser's session history using `pushState`. Use the `replace` option to replace the current history entry instead:

```js
// Default behavior: adds new history entry (pushState)
yield actions.navigate( '/page-2/' );

// Replace current history entry (replaceState)
yield actions.navigate( '/page-2/', { replace: true } );
```

Use `replace: true` when:
- Implementing redirects where the original URL shouldn't be in history.
- Updating query parameters for filtering/sorting where each change shouldn't be a separate history entry.
- Implementing infinite scroll where you update the URL but don't want each page to be a separate history entry.

### Changing the timeout

Navigation will abort if it takes too long. The default timeout is 10 seconds. Use the `timeout` option to change this:

```js
// Shorter timeout for faster failure
yield actions.navigate( '/page/', { timeout: 5000 } );

// Longer timeout for slow connections
yield actions.navigate( '/page/', { timeout: 30000 } );
```

### Handling fetch errors

When navigation fails (network error, timeout, or server error), the router automatically falls back to a full page reload. You can implement custom error handling by catching errors from `navigate()`:

```js
store( 'myPlugin', {
    state: {
        error: null,
    },
    actions: {
        navigateSafely: withSyncEvent( function* ( event ) {
            event.preventDefault();
            state.error = null;

            try {
                const { actions } = yield import(
                    '@wordpress/interactivity-router'
                );
                yield actions.navigate( event.target.href, {
                    timeout: 5000,
                } );
            } catch ( error ) {
                state.error = 'Navigation failed. Please try again.';
                console.error( 'Navigation error:', error );

                // Optionally fall back to full page navigation:
                // window.location.href = event.target.href;
            }
        } ),
    },
} );
```

For more control, you can fetch and process pages manually:

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
                    state.error = `Error: ${response.status}`;
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
// In your theme's functions.php or a plugin
add_action( 'wp', function() {
    // Disable on specific page templates.
    if ( is_page_template( 'template-complex.php' ) ) {
        wp_interactivity_config(
            'core/router',
            array( 'clientNavigationDisabled' => true )
        );
    }

    // Disable on admin-like pages.
    if ( is_page( 'dashboard' ) ) {
        wp_interactivity_config(
            'core/router',
            array( 'clientNavigationDisabled' => true )
        );
    }
} );
```

When `clientNavigationDisabled` is `true`:
- `actions.navigate()` triggers a full page reload.
- `actions.prefetch()` does nothing.
- Navigating from another page to this page forces a reload.

### Disabling navigation feedback

The Interactivity API router includes built-in feedback during navigation:
- **Loading animation**: A progress bar that appears during navigation.
- **Screen reader announcements**: Accessibility announcements for navigation progress.

In some cases, you may want to disable these:

```js
// Disable loading animation (for instant-feeling updates)
yield actions.navigate( '/page/', { loadingAnimation: false } );

// Disable screen reader announcements (when providing custom announcements)
yield actions.navigate( '/page/', { screenReaderAnnouncement: false } );

// Disable both
yield actions.navigate( '/page/', {
    loadingAnimation: false,
    screenReaderAnnouncement: false,
} );
```

Use cases for disabling feedback:
- **Silent updates**: Background refreshes where you don't want to draw attention.
- **Custom loading UI**: When you're implementing your own loading indicators.
- **Custom accessibility**: When you're providing your own screen reader announcements.
