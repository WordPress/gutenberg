# Client-Side Navigation

Client-side navigation is a technique that allows navigation between pages without requiring a full page reload. Instead of the browser fetching an entirely new HTML document from the server, client-side navigation fetches the new page's content and updates only the parts of the DOM that have changed. This results in faster, smoother page transitions and a more app-like user experience.

The Interactivity API provides client-side navigation through the `@wordpress/interactivity-router` package. This package enables you to implement region-based navigation, where only specific parts of your page are updated when navigating between URLs.

## Table of contents

- [How client-side navigation works](#how-client-side-navigation-works)
- [Getting started with the Interactivity Router](#getting-started-with-the-interactivity-router)
    - [Setting up router regions](#setting-up-router-regions)
    - [Implementing navigation](#implementing-navigation)
    - [Implementing prefetching](#implementing-prefetching)
    - [Complete example: Pagination](#complete-example-pagination)
- [More advanced use cases](#more-advanced-use-cases)
    - [Adding new regions on navigation](#adding-new-regions-on-navigation)
    - [Handling server state updates](#handling-server-state-updates)
    - [Overriding cached pages](#overriding-cached-pages)
    - [Using custom HTML](#using-custom-html)
    - [Managing browser history](#managing-browser-history)
    - [Changing the timeout](#changing-the-timeout)
    - [Handling fetch errors](#handling-fetch-errors)
    - [Disabling client-side navigation on certain pages](#disabling-client-side-navigation-on-certain-pages)
    - [Disabling navigation feedback](#disabling-navigation-feedback)
- [The Interactivity Router in depth](#the-interactivity-router-in-depth)
    - [The page cache](#the-page-cache)
    - [Router regions](#router-regions)
    - [CSS handling](#css-handling)
    - [Script module handling](#script-module-handling)
    - [Server state and context](#server-state-and-context)
    - [Putting it all together: the navigation flow](#putting-it-all-together-the-navigation-flow)

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

## Getting started with the Interactivity Router

The `@wordpress/interactivity-router` package is bundled with WordPress Core since version 6.5. If you are starting a new project, the easiest way to get set up is using the [`@wordpress/create-block-interactive-template`](https://www.npmjs.com/package/@wordpress/create-block-interactive-template) scaffolding tool, which creates a block with the Interactivity API already configured:

```bash
npx @wordpress/create-block@latest my-interactive-block --template @wordpress/create-block-interactive-template
```

If you already have an interactive block and want to add client-side navigation, you need to:

1. **Add the router dependency**: Add `@wordpress/interactivity-router` as a dependency of your block's script module. This is typically done by dynamically importing the package in your `view.js` file (as shown in the examples below), which ensures it is only loaded when needed.
2. **Define router regions**: Mark the HTML elements that should be updated during navigation using the `data-wp-router-region` attribute.
3. **Trigger navigation**: Use the router's `actions.navigate()` function to navigate programmatically when the user interacts with your block.

For detailed API documentation, see the [`@wordpress/interactivity-router` package README](/packages/interactivity-router/README.md).

### Setting up router regions

Router regions are the parts of your page that the router will update during client-side navigation. You mark them with the `data-wp-router-region` directive, which takes a unique ID as its value. When navigation occurs, the router matches regions on the current page with regions on the target page by their IDs and replaces their content — leaving everything outside router regions untouched.

Define a router region in your block's markup by adding `data-wp-router-region` alongside `data-wp-interactive`:

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

To trigger client-side navigation, you define an **action** in your block's store and connect it to a DOM event using an Interactivity API directive. Actions are functions defined inside `store()` that handle user interactions — similar to event handlers in other frameworks. When connected to an element through a directive like `data-wp-on--click`, the action runs whenever that event fires.

Here's how to implement a link that navigates client-side. First, the HTML in your block's `render.php` connects the link's click event to the `navigateTo` action:

```html
<a
    data-wp-on--click="actions.navigateTo"
    href="/page-2/"
>
    Go to Page 2
</a>
```

> [!NOTE]
> This element must be placed inside an element with the `data-wp-interactive="myPlugin"` directive (like the router region defined above), so the directive knows which store namespace to look up the action in. Alternatively, you can specify the namespace explicitly in the directive value itself: `data-wp-on--click="myPlugin::actions.navigateTo"`. For more details on how namespaces work, see the [Interactivity API Reference](/docs/reference-guides/interactivity-api/api-reference.md).

Then, in your `view.js`, you define the `navigateTo` action. It prevents the browser's default full-page navigation and uses the router's `navigate()` function instead:

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

> [!NOTE]
> The `withSyncEvent()` wrapper is required for actions that need to call synchronous event methods like `event.preventDefault()`. See the [withSyncEvent() documentation](/docs/reference-guides/interactivity-api/directives-and-store.md#withsyncevent) for details.

### Implementing prefetching

The router also provides a `prefetch()` function that fetches a page and stores it in an internal cache without performing navigation. By prefetching pages before the user clicks, subsequent navigations feel instant because the content is already available.

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

The corresponding actions in `view.js` handle each event:

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

The block queries posts for the current page and renders them inside a router region. Pagination links at the bottom allow the user to move between pages. When the user hovers over a "Previous" or "Next" link, the target page is prefetched. When they click, the router navigates client-side — replacing only the content inside the router region without a full page reload. After navigation, the page scrolls smoothly to the top.

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

For more details, see the [Understanding global state, local context, and derived state](/docs/reference-guides/interactivity-api/core-concepts/undestanding-global-state-local-context-and-derived-state.md#subscribing-to-server-state-and-context) guide.

### Overriding cached pages

By default, once a page is cached, subsequent navigations use the cached version. Use the `force` option to re-fetch a page even if it's cached:

```js
// Force re-fetch with navigate()
yield actions.navigate( '/products/', { force: true } );

// Force re-fetch with prefetch()
yield actions.prefetch( '/products/', { force: true } );
```

> [!IMPORTANT]
> If you're using `force: true` to refresh a page after a mutation (POST, PUT, DELETE request), make sure the mutation has completed before navigating:

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



## The Interactivity Router in depth

This section provides a detailed technical explanation of how client-side navigation works internally. Understanding these internals can help you debug issues, optimize performance, and make informed decisions about how to structure your interactive blocks.

### The page cache

At the heart of the Interactivity API router is a page cache—a simple in-memory store that maps URLs to their processed page representations. When you call `prefetch()` or `navigate()`, the router first checks this cache to see if the target page has already been fetched and processed.

The cache uses a normalized version of the URL as its key. This normalization strips away the domain and any hash fragments, keeping only the pathname and query parameters. For example, `https://example.com/products/?category=shoes#details` becomes `/products/?category=shoes`. This ensures that navigations to the same logical page (regardless of how the URL was constructed) share the same cache entry.

Each entry in the cache stores not just the fetched HTML, but a fully processed page representation containing:

- **Virtual DOM trees** for each router region found in the page
- **Style sheet references** needed by the page
- **Script module information** for JavaScript that should be loaded
- **The page title** for updating the document title
- **Server state** that was embedded in the page by WordPress

<!-- IMAGE: Diagram showing the page cache structure. A box labeled "Page Cache" contains multiple entries, each showing a URL path (like "/products/", "/about/", "/contact/") mapped to a "Page Object" containing icons for vDOM, styles, scripts, title, and state. Arrows show how navigate() and prefetch() interact with this cache. -->

An important detail is that the cache stores promises rather than resolved values. When a fetch begins, the router immediately stores the pending promise in the cache. This means that if multiple calls to `prefetch()` or `navigate()` target the same URL simultaneously (for example, if a user rapidly hovers over multiple links pointing to the same page), only one network request is made. All callers receive the same promise and wait for the same result.

Once a page is in the cache, it remains there for the duration of the browser session. Subsequent navigations to that URL will use the cached version instantly, without any network request. This is why client-side navigation feels so fast after the initial visit—the page is already prepared and ready to render.

If you need to force a fresh fetch (for example, after submitting a form that changes the page's content), you can use the `force: true` option with `navigate()` or `prefetch()`. This bypasses the cache check and fetches the page anew, replacing the existing cache entry with the fresh content.

### Router regions

Router regions are the sections of your page that the router knows how to update during client-side navigation. They act as boundaries that tell the router "this is the content that should change when navigating between pages."

**Defining router regions**

You define a router region by adding the `data-wp-router-region` attribute to an element. The element must also be interactive (either having `data-wp-interactive` directly, or being a descendant of an element with `data-wp-interactive`).

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

2. As a JSON object (when you need the `attachTo` feature, explained later):
   ```html
   <div
       data-wp-interactive="myPlugin"
       data-wp-router-region='{ "id": "myPlugin/modal", "attachTo": "body" }'
   >
       <!-- Region content -->
   </div>
   ```

The region ID must be unique within a single page and consistent across pages that share the same region. For example, if both your "Products" page and "Product Detail" page have a sidebar, and you want that sidebar to update during navigation, both pages should define a region with the same ID (e.g., `"myPlugin/sidebar"`).

<!-- IMAGE: Side-by-side comparison of two pages. Page A shows a layout with header, main content area (highlighted and labeled "data-wp-router-region='main'"), and sidebar. Page B shows a similar layout with the same regions highlighted. Arrows between them show how regions with matching IDs correspond to each other. -->

**Requirements for router regions**

For a router region to function correctly, it must meet these requirements:

1. **Must be inside an interactive scope**: The element with `data-wp-router-region` must either have `data-wp-interactive` itself, or be nested inside an element that does. This is because the router relies on the Interactivity API's directive processing to handle the region content.

2. **Must have a unique ID**: No two regions on the same page should share the same ID. If they do, the router won't know which region to update.

3. **Should include `data-wp-interactive` on nested regions**: When you place a router region inside another interactive element, always include the `data-wp-interactive` attribute on the region element itself:

```html
<!-- Correct: The region element has data-wp-interactive -->
<div data-wp-interactive="myPlugin">
    <div
        data-wp-interactive="myPlugin"
        data-wp-router-region="myPlugin/sidebar"
    >
        <!-- Sidebar content -->
    </div>
</div>

<!-- Incorrect: This region may not update properly -->
<div data-wp-interactive="myPlugin">
    <div data-wp-router-region="myPlugin/sidebar">
        <!-- This won't work reliably! -->
    </div>
</div>
```

**How regions are processed during page fetch**

When the router fetches a new page (either through `prefetch()` or as part of `navigate()`), it processes the HTML to extract and prepare all router regions. This happens in several steps:

First, the router parses the fetched HTML into a document structure using the browser's built-in HTML parser. This gives it a complete DOM tree to work with, just as if the page had been loaded normally.

Next, the router scans this document for all elements that have both `data-wp-interactive` and `data-wp-router-region` attributes. For each region found, it extracts the region ID and checks whether the region is nested inside another region. Only top-level regions are processed directly; nested regions are handled as part of their parent's content.

For each top-level region, the router converts the HTML into a virtual DOM (vDOM) representation. The virtual DOM is a lightweight JavaScript object structure that mirrors the actual DOM but can be compared and manipulated much more efficiently. Importantly, the region element itself is included in this conversion—not just its children. This means that attributes on the region element, such as `data-wp-context`, will also be processed and updated during navigation.

<!-- IMAGE: Flowchart showing the region processing pipeline. Starting with "Fetched HTML" (showing raw HTML code), an arrow leads to "Parse HTML" (DOM tree icon), then to "Find Regions" (highlighting regions in the tree), then to "Convert to vDOM" (showing a simplified tree structure), and finally to "Store in Cache" (the cache icon from earlier). -->

Finally, each region's virtual DOM is stored in the page cache entry, indexed by its region ID. The cache entry now contains a map of region IDs to their corresponding virtual DOM trees.

**How regions are rendered during navigation**

When `navigate()` is called and the target page has been successfully fetched (or was already cached), the router needs to update the current page to show the new content. This rendering process is carefully orchestrated to be efficient and avoid visual glitches.

The router begins by examining which regions exist in the current page and which exist in the target page. Based on this comparison, three different scenarios can occur:

**Scenario 1: Region exists on both pages (update)**

This is the most common case. When a region with a given ID exists on both the current page and the target page, the router updates the existing region with the new content.

Rather than simply replacing the entire region's HTML (which would destroy any internal state and cause a jarring visual transition), the router uses a virtual DOM diffing algorithm. This algorithm compares the current region's virtual DOM with the new region's virtual DOM and calculates the minimum set of changes needed to transform one into the other.

For example, if a product list region contains 10 products on the current page and 10 different products on the new page, the diffing algorithm might determine that it only needs to update the text content and image sources within the existing list item elements—rather than destroying and recreating all 10 items from scratch. This preserves DOM state (like scroll position within the region, or focus state) and produces smoother visual transitions.

<!-- IMAGE: Before/after comparison showing region update. Left side shows "Current Page" with a region containing items A, B, C (each in a box). Right side shows "Target Page" with items A, D, C. In the middle, arrows show that A and C stay in place while B transforms into D. Caption: "The diffing algorithm minimizes DOM changes." -->

**Scenario 2: Region exists only on the target page with `attachTo` (create)**

Sometimes a page contains a region that doesn't exist on the current page—for example, a modal dialog that only appears on certain pages. If this region has the `attachTo` property specified, the router will dynamically create it.

The `attachTo` property contains a CSS selector that identifies where in the current page the new region should be appended. When the router encounters such a region, it:

1. Finds the element matching the `attachTo` selector in the current page
2. Creates new DOM elements for the region
3. Appends these elements to the matched parent
4. Renders the region's virtual DOM into the newly created elements

This allows content that exists on one page but not another to appear smoothly during navigation, without requiring the target element to exist in advance.

**Scenario 3: Region exists only on the current page (remove)**

When a region exists on the current page but not on the target page, it means that content is no longer needed. The router handles this by setting the region's content to empty, effectively clearing it from the display.

If the region was dynamically created via `attachTo` during a previous navigation, the entire region element is removed from the DOM. If it was part of the original page structure, the element remains but its content is cleared.

<!-- IMAGE: Three-panel diagram showing the three scenarios. Panel 1 "Update": Same-shaped regions on both pages with a refresh arrow. Panel 2 "Create": Region with attachTo appears from the target page and gets inserted into current page's body. Panel 3 "Remove": Region fades out/disappears from current page. -->

**What happens to HTML outside router regions?**

An important detail to understand is that HTML outside of router regions remains completely untouched during client-side navigation. The router only modifies the content inside the regions it manages—everything else in the DOM stays exactly as it was.

This means that if you have static elements like a site header, footer, or navigation menu that aren't wrapped in a router region, they won't change when the user navigates between pages. This can be intentional (for elements that truly are the same across all pages) or it can be a source of confusion if you expect those elements to update.

However, there's an important exception: **interactive elements outside router regions can still react to global state changes**. If you have an interactive block outside any router region, with directives that use `getServerState()` to read global state, these directives will automatically re-evaluate when navigation brings in new server state.

For example, consider a shopping cart icon in the header that displays the number of items:

```html
<!-- This header is NOT inside a router region -->
<header data-wp-interactive="myShop">
    <div class="cart-icon">
        <span data-wp-text="state.cartCount"></span> items
    </div>
</header>

<!-- This is the router region that updates during navigation -->
<main
    data-wp-interactive="myShop"
    data-wp-router-region="myShop/content"
>
    <!-- Page content -->
</main>
```

If `state.cartCount` comes from the regular client-side state, the cart icon will not update during navigation—even if the new page has a different cart count in its server state. The header, while being interactive, is outside any router region, so it's not re-rendered.

But if you use `getServerState()` instead:

```js
const { state } = store( 'myShop', {
    state: {
        get cartCount() {
            // This reacts to server state changes during navigation
            return getServerState().cartCount;
        },
    },
} );
```

Now the cart icon will update whenever navigation brings in a new `cartCount` value from the server, even though the header itself is outside any router region. This is because `getServerState()` creates a reactive subscription to server-provided state, which is updated during every navigation.

This pattern is useful for global UI elements that need to stay synchronized with server data across navigations, without requiring them to be inside a router region.

### CSS handling

One of the trickier aspects of client-side navigation is managing CSS style sheets. Different pages may require different styles, and the router must ensure that the correct styles are active for each page—without causing flashes of unstyled content or breaking the CSS cascade order.

**The challenge of CSS cascade order**

CSS rules are applied in a specific order, and when two rules have the same specificity, the one that appears later in the document "wins." This means that the order of `<link>` and `<style>` elements in your HTML matters. If the router simply appended new style sheets to the end of the document, it could inadvertently change which rules take precedence, causing visual bugs.

Consider this example: Page A has style sheets [base.css, theme.css], and Page B has [base.css, components.css, theme.css]. If the user navigates from A to B, the router needs to insert components.css between base.css and theme.css—not at the end. Otherwise, any rules in theme.css that are meant to override components.css would stop working.

**How styles are extracted and prepared**

When the router fetches a page, it extracts all style-related elements: both `<link rel="stylesheet">` tags and inline `<style>` blocks. Each style element is identified by a combination of its attributes (for `<link>` tags, primarily the `href`) or its content hash (for inline `<style>` blocks).

The router then compares the extracted styles with those already present in the current page's document. Styles fall into three categories:

1. **Already present**: The style sheet is already loaded in the current page. No action needed during preparation.
2. **New**: The style sheet doesn't exist in the current page. It needs to be added.
3. **No longer needed**: The style sheet is in the current page but not in the target page. It will be disabled during navigation.

**Preloading new styles without applying them**

For new style sheets, the router faces a dilemma: it needs to ensure the styles are fully loaded before showing the new page content (to prevent flash of unstyled content), but it doesn't want to apply them yet (because the user is still viewing the current page).

The solution is to add new `<link>` elements with their `media` attribute set to a value that prevents them from applying. The router uses `media="preload"`, which tells the browser "this style sheet applies to no media types"—effectively disabling it while still allowing the browser to download and parse it.

When a `<link>` element is added this way, the browser begins downloading the CSS file immediately. The router tracks when each style sheet finishes loading by listening for the `load` event. This allows it to wait until all new styles are ready before proceeding with navigation.

<!-- IMAGE: Timeline diagram showing style preloading. At t=0, "Prefetch starts" and a link element with media="preload" is added. Browser download begins (shown as a progress bar). At t=200ms, download completes and "load event fires". The styles remain inactive (grayed out) until navigation actually occurs. -->

**Maintaining cascade order with the Shortest Common Supersequence algorithm**

When inserting new style sheets, the router must preserve the correct cascade order. It accomplishes this using an algorithm based on finding the Shortest Common Supersequence (SCS) of two sequences.

Given the current page's style sheets (sequence X) and the target page's style sheets (sequence Y), the SCS algorithm finds the shortest sequence that contains both X and Y as subsequences while preserving their internal order. This tells the router exactly where to insert new elements and which existing elements to keep.

For example:
- Current page styles (X): [A, C, D]
- Target page styles (Y): [A, B, C, E]
- Shortest Common Supersequence: [A, B, C, D, E]

The algorithm then determines: keep A and C in place, insert B between A and C, keep D after C, and insert E at the end.

<!-- IMAGE: Visual representation of the SCS algorithm. Two rows show the "Current" sequence [A, C, D] and "Target" sequence [A, B, C, E]. Below them, the "Merged (SCS)" sequence shows [A, B, C, D, E] with color coding: A and C in blue (shared), B and E in green (inserted), D in gray (will be disabled). Arrows show how elements from both sequences map to the merged result. -->

This approach ensures that:
- Style sheets that appear in both pages remain in their correct relative order
- New style sheets are inserted at the proper position to maintain cascade correctness
- The minimum number of DOM operations is performed

**Activating and deactivating styles during navigation**

When `navigate()` actually renders the new page, the router toggles style sheets on and off:

- **Activating styles**: For each style sheet that belongs to the target page, the router removes the `media="preload"` override (or restores the original `media` attribute if one was specified). This causes the browser to apply those styles.

- **Deactivating styles**: For each style sheet that was in the current page but not the target page, the router sets `media="preload"`. This disables the styles without removing the element from the DOM.

By keeping deactivated style elements in the DOM (rather than removing them), the router can quickly reactivate them if the user navigates back. The styles are already loaded and parsed; they just need to be enabled.

### Script module handling

Modern WordPress blocks often use JavaScript modules (ES modules) for their interactive behavior. The router must ensure that when navigating to a new page, any JavaScript modules required by that page are loaded and executed.

**Identifying modules for client-side navigation**

Not all script modules should be loaded during client-side navigation. Some modules might be for admin functionality, or for features that only apply on initial page load. To distinguish which modules should be loaded, WordPress uses a special data attribute:

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

When the router fetches a new page, it extracts the import map from that page and merges any new mappings with the current page's import map. This ensures that modules can resolve their dependencies correctly even when navigating between pages that have different sets of scripts.

**Preloading modules and their dependencies**

Preloading script modules is more complex than preloading styles because modules can import other modules. A single entry-point module might depend on dozens of other modules, which might depend on dozens more.

To handle this, the router performs a recursive dependency resolution:

1. It fetches the source code of each entry-point module
2. It parses the source to find all `import` statements
3. For each import, it resolves the module specifier using the import map
4. It recursively fetches and parses each dependency
5. This continues until all modules in the dependency tree have been fetched

The router is smart about avoiding redundant work. If a module has already been loaded by the initial page (it appears in the initial import map), the router doesn't fetch it again—the browser already has it cached.

<!-- IMAGE: Tree diagram showing module dependency resolution. At the top, "view.js" (the entry point). Arrows lead down to its dependencies: "@wordpress/interactivity" and "./components/modal.js". The interactivity module is shown grayed out with a note "Already loaded - skip". The modal.js module has its own dependencies branching below it. Each node shows whether it needs to be fetched or can be skipped. -->

**Handling the import timing**

An important subtlety is that module code shouldn't execute until navigation actually happens. The router needs to have the module code ready (to avoid delays during navigation), but it shouldn't run that code while the user is still viewing the current page.

The router accomplishes this by transforming the fetched modules. It rewrites the source code to use blob URLs (data embedded directly in the URL) and caches these transformed modules. When navigation occurs, the router uses dynamic `import()` to execute the cached modules.

Because the browser's module system caches modules by URL, importing the same blob URL multiple times returns the same module instance. This ensures that each module is only executed once, even if multiple code paths try to import it.

**Module execution during navigation**

When `navigate()` renders the new page, it imports all the modules that were preloaded for that page:

```js
// Simplified conceptual view of what happens
for (const moduleInfo of page.scriptModules) {
    await import(moduleInfo.blobUrl);
}
```

Each module's top-level code runs, which typically includes calls to `store()` to register actions, callbacks, and state. Because the Interactivity API's store is global and additive, these registrations merge with existing store definitions from the initial page load.

### Server state and context

WordPress blocks often need data from the server—configuration values, content from the database, user preferences, and more. The Interactivity API provides two mechanisms for this: global state and local context. During client-side navigation, this server-provided data needs to be extracted from the new page and made available to the client-side code.

**How server data is embedded in pages**

When WordPress renders a page with interactive blocks, it embeds server-provided data in special `<script>` tags:

```html
<!-- Global state -->
<script type="application/json" id="wp-script-module-data-@wordpress/interactivity">
{
    "state": {
        "myPlugin":{
            "cartItemCount": 3,
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
    <!-- Block content -->
</div>
```

**Extracting state and context during fetch**

When the router fetches a new page, it extracts both types of server data:

1. **Global state**: The router finds the `<script type="application/json">` element with ID `wp-script-module-data-@wordpress/interactivity` and parses its JSON content. This state is stored in the page cache entry.

2. **Local context**: Context values are embedded in the virtual DOM representation of each router region. When a region's HTML is converted to vDOM, the `data-wp-context` attributes are preserved and will be processed during rendering.

**Merging server data during navigation**

When navigation renders the new page, the server-provided data needs to merge with the existing client-side state. This merge follows specific rules:

For global state, the server state does not overwrite existing client state properties. During navigation, only properties that don't already exist on the client are added. Existing client-side properties are preserved as-is. If you need the client state to reflect server changes during navigation, you must use `getServerState()` to subscribe to server state updates and then manually update the client state accordingly.

For local context, the behavior is similar. The server context and client context are tracked separately by the Interactivity API. During navigation, the server context is updated with the values from the new page, but the client context is not automatically overwritten. You can use `getServerContext()` to read the server-provided values or `getContext()` to read the client-side values, and decide which one to use in your code.

**Subscribing to server data changes**

The Interactivity API provides two functions for accessing server-provided data that updates during navigation:

- `getServerState()`: Returns the global state as provided by the server for the current page
- `getServerContext()`: Returns the local context as provided by the server for the current element

These functions are reactive. When used inside a callback or derived state getter, they automatically set up a subscription. When navigation occurs and new server data arrives, any code using these functions will re-run with the new values.

This is different from the regular `state` and `getContext()`, which return the client-side state and context. As explained above, existing client-side values are not overwritten during navigation, so `state` and `getContext()` will keep reflecting whatever the client had before navigating. Use `getServerState()` and `getServerContext()` when you need to react to the values that the server sent for the new page.

For more details, see the [Understanding global state, local context, and derived state](/docs/reference-guides/interactivity-api/core-concepts/undestanding-global-state-local-context-and-derived-state.md#subscribing-to-server-state-and-context) guide.

### Putting it all together: the navigation flow

Now that we've examined each component, let's trace through a complete navigation to see how they work together.

**Phase 1: Prefetch (optional but recommended)**

When the user hovers over a link, your code might call `prefetch()`:

1. The router normalizes the URL and checks the page cache
2. If not cached, it begins fetching the HTML
3. The fetched HTML is parsed into a document
4. Router regions are extracted and converted to virtual DOM
5. Style sheets are compared with current page; new ones are added with `media="preload"`
6. Script modules are identified, dependencies resolved, and source code fetched
7. Server state is extracted
8. The fully processed page is stored in the cache
9. The function returns (the page is now ready for instant navigation)

**Phase 2: Navigate**

When the user clicks the link and your code calls `navigate()`:

1. The router checks if client navigation is disabled; if so, falls back to full page load
2. If not already prefetched, the fetch process from Phase 1 runs now
3. The router waits for the page to be ready (fetch complete, styles loaded)
4. A loading indicator may appear if the wait exceeds a threshold (400ms)
5. Script modules for the new page are imported and executed
6. The rendering phase begins (wrapped in a batch for efficiency):
   - Server state is merged with client state
   - Each router region is updated with its new virtual DOM
   - Regions with `attachTo` that don't exist are created and appended
   - Styles are activated/deactivated as needed
   - The document title is updated
7. Browser history is updated (pushState or replaceState)
8. Screen reader announcement is made for accessibility
9. If the URL has a hash, the page scrolls to that element
10. Navigation is complete

<!-- IMAGE: Flowchart showing complete navigation flow. Starts with "User hovers link" flowing to "prefetch()" which branches through the prefetch steps. Then "User clicks link" leads to "navigate()" which shows the navigation steps in sequence. Key decision points are shown as diamonds (e.g., "In cache?", "Styles loaded?"). The flow ends at "Navigation complete" with a checkmark. -->

**Race condition protection**

A subtle but important detail: users don't always wait for navigation to complete before clicking another link. The router handles this gracefully.

When `navigate()` is called, the router remembers the target URL. If another `navigate()` call comes in before the first completes, the router updates its target and the first navigation is abandoned. When the first navigation's fetch completes, it checks whether its URL is still the current target—if not, it simply returns without rendering.

This ensures that rapid clicking through multiple links doesn't cause visual glitches or render stale content. Only the most recent navigation completes.
