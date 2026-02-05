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

## Getting started with the Interactivity Router

The `@wordpress/interactivity-router` package is bundled with WordPress Core since version 6.5. To use it in your interactive blocks, you need to:

1. **Add the dependency**: Ensure `@wordpress/interactivity-router` is listed as a dependency for your script module.
2. **Define router regions**: Mark the HTML elements that should be updated during navigation.
3. **Trigger navigation**: Use the `actions.navigate()` function to navigate programmatically.

### Dynamic imports for optimal performance

The recommended pattern is to import the router package dynamically to reduce the initial JavaScript bundle size. The router is only loaded when navigation is actually needed:

```js
import { store, withSyncEvent } from '@wordpress/interactivity';

store( 'myPlugin', {
	actions: {
		// Use withSyncEvent because we need to call preventDefault().
		goToPage: withSyncEvent( function* ( event ) {
			event.preventDefault();

			// Dynamically import the router when needed.
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( event.target.href );
		} ),
	},
} );
```

_Note: Actions that need to call synchronous event methods like `event.preventDefault()` must wrap the handler with `withSyncEvent()`. See the [withSyncEvent() documentation](/docs/reference-guides/interactivity-api/directives-and-store.md#withsyncevent) for details._

## Defining router regions

Router regions are sections of your page that will be updated during client-side navigation. You define them using the `data-wp-router-region` directive.

### Basic usage

To create a router region, add the `data-wp-router-region` directive to an element that also has `data-wp-interactive`:

```html
<div
	data-wp-interactive="myPlugin"
	data-wp-router-region="main-content"
>
	<!-- This content will be replaced during navigation -->
	<h1>Page Title</h1>
	<p>Page content goes here...</p>
</div>
```

The value of `data-wp-router-region` must be a unique identifier for that region. When navigating to a new page, the router will find regions with matching IDs and replace their content.

### Requirements for router regions

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

### How regions are matched during navigation

When navigating between pages, the router compares regions:

- **Region exists on both pages**: The content is updated with the new page's content.
- **Region exists only on the new page (without `attachTo`)**: The region is not added to the DOM.
- **Region exists only on the new page (with `attachTo`)**: The region is created and appended to the specified parent.
- **Region exists only on the current page**: The region is removed from the DOM.

## Using the navigate action

The `navigate` action is the primary way to trigger client-side navigation programmatically.

### Basic navigation

```js
import { store, withSyncEvent } from '@wordpress/interactivity';

store( 'myPlugin', {
	actions: {
		handleLinkClick: withSyncEvent( function* ( event ) {
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
	data-wp-on--click="actions.handleLinkClick"
	href="/another-page/"
>
	Go to another page
</a>
```

### Navigation options

The `navigate` function accepts an optional second parameter with configuration options:

```js
yield actions.navigate( href, {
	force: false, // Re-fetch even if the page is cached
	replace: false, // Replace current history entry instead of adding new one
	timeout: 10000, // Abort navigation after this many milliseconds
	loadingAnimation: true, // Show loading animation during navigation
	screenReaderAnnouncement: true, // Announce navigation to screen readers
	html: null, // Provide HTML directly instead of fetching
} );
```

#### Option details

| Option                     | Type    | Default | Description                                                       |
| -------------------------- | ------- | ------- | ----------------------------------------------------------------- |
| `force`                    | boolean | `false` | Force re-fetching the page even if it's already cached            |
| `replace`                  | boolean | `false` | Replace the current browser history entry instead of adding a new one |
| `timeout`                  | number  | `10000` | Maximum time (in ms) to wait for the navigation before aborting   |
| `loadingAnimation`         | boolean | `true`  | Whether to show the loading animation during navigation           |
| `screenReaderAnnouncement` | boolean | `true`  | Whether to announce navigation status to screen readers           |
| `html`                     | string  | `null`  | HTML string to use instead of fetching from the URL               |

### Example: Navigation with custom options

```js
store( 'myPlugin', {
	actions: {
		navigateWithReplace: withSyncEvent( function* ( event ) {
			event.preventDefault();

			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);

			// Replace history entry and use a shorter timeout.
			yield actions.navigate( event.target.href, {
				replace: true,
				timeout: 5000,
			} );
		} ),
	},
} );
```

## Prefetching pages

Prefetching allows you to load a page's content before the user actually navigates to it. This makes subsequent navigation feel instant.

### Basic prefetching

```js
store( 'myPlugin', {
	actions: {
		*prefetchPage( event ) {
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.prefetch( event.target.href );
		},
	},
} );
```

```html
<a
	data-wp-on--mouseenter="actions.prefetchPage"
	data-wp-on--click="actions.handleLinkClick"
	href="/another-page/"
>
	Hover to prefetch
</a>
```

### Prefetch options

| Option  | Type    | Default | Description                                           |
| ------- | ------- | ------- | ----------------------------------------------------- |
| `force` | boolean | `false` | Force re-fetching even if the page is already cached  |
| `html`  | string  | `null`  | HTML string to use instead of fetching from the URL   |

### Example: Prefetch on hover with force reload

```js
store( 'myPlugin', {
	actions: {
		*prefetchFresh( event ) {
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			// Always fetch fresh content, ignore cache.
			yield actions.prefetch( event.target.href, { force: true } );
		},
	},
} );
```

## Router state

The Interactivity Router exposes reactive state that you can use in your directives:

```js
const { state } = store( 'core/router', {
	state: {
		url: window.location.href,
		navigation: {
			hasStarted: false,
			hasFinished: false,
		},
	},
} );
```

### Available state properties

| Property                    | Type    | Description                                     |
| --------------------------- | ------- | ----------------------------------------------- |
| `state.url`                 | string  | The current URL, synchronized with browser location |
| `state.navigation.hasStarted`  | boolean | `true` when a navigation has started            |
| `state.navigation.hasFinished` | boolean | `true` when a navigation has completed          |

### Example: Showing a loading indicator

```html
<div data-wp-interactive="myPlugin">
	<div
		data-wp-class--is-loading="state.navigation.hasStarted"
		data-wp-class--is-loaded="state.navigation.hasFinished"
	>
		<span data-wp-bind--hidden="!state.navigation.hasStarted">
			Loading...
		</span>
		<!-- Page content -->
	</div>
</div>
```

```css
.is-loading {
	opacity: 0.5;
	pointer-events: none;
}
```

## Dynamic regions with attachTo

The `attachTo` property allows you to create regions that can be dynamically added to any part of the DOM, even if they don't exist on the initial page. This is useful for elements like modals, overlays, or sidebars that appear only on certain pages.

### Using attachTo

Instead of a simple string ID, pass a JSON object with `id` and `attachTo` properties:

```html
<div
	data-wp-interactive="myPlugin"
	data-wp-router-region='{ "id": "my-modal", "attachTo": "body" }'
>
	<div class="modal">
		<!-- Modal content -->
	</div>
</div>
```

The `attachTo` value is a CSS selector pointing to the parent element where the region should be appended.

### How attachTo works

- If the region with `attachTo` exists on the new page but not the current page, it is created and appended to the element matching the `attachTo` selector.
- If the region exists on both pages, the content is updated (and `attachTo` is ignored).
- If the region exists on the current page but not the new page, it is removed from the DOM.
- If the region with `attachTo` is present on the initial page load, it is treated as a regular region (the `attachTo` property is ignored for the initial page).

### Example: Modal that appears on navigation

**Page 1 (no modal):**
```html
<div data-wp-interactive="myPlugin" data-wp-router-region="main">
	<h1>Page without modal</h1>
	<a
		data-wp-on--click="actions.navigate"
		href="/page-with-modal/"
	>
		Open page with modal
	</a>
</div>
```

**Page 2 (with modal):**
```html
<div data-wp-interactive="myPlugin" data-wp-router-region="main">
	<h1>Page with modal</h1>
</div>

<!-- Modal region that will be appended to body -->
<div
	data-wp-interactive="myPlugin"
	data-wp-router-region='{ "id": "myPlugin/modal", "attachTo": "body" }'
>
	<div class="modal-overlay">
		<div class="modal-content">
			<h2>I'm a modal!</h2>
			<a
				data-wp-on--click="actions.navigate"
				href="/page-without-modal/"
			>
				Close
			</a>
		</div>
	</div>
</div>
```

When navigating from Page 1 to Page 2, the modal region is created and appended to `body`. When navigating back to Page 1, the modal is removed.

## Practical examples

### Example 1: Simple pagination

This example shows how to implement client-side pagination for a list of posts.

**PHP (render.php):**
```php
<?php
$current_page = isset( $_GET['paged'] ) ? (int) $_GET['paged'] : 1;
$posts = new WP_Query( array(
	'paged' => $current_page,
	'posts_per_page' => 5,
) );
?>

<div
	data-wp-interactive="myPagination"
	data-wp-router-region="posts-list"
>
	<ul class="posts-list">
		<?php while ( $posts->have_posts() ) : $posts->the_post(); ?>
			<li><?php the_title(); ?></li>
		<?php endwhile; ?>
	</ul>

	<nav class="pagination">
		<?php if ( $current_page > 1 ) : ?>
			<a
				data-wp-on--click="actions.navigate"
				href="?paged=<?php echo $current_page - 1; ?>"
			>
				Previous
			</a>
		<?php endif; ?>

		<?php if ( $posts->max_num_pages > $current_page ) : ?>
			<a
				data-wp-on--click="actions.navigate"
				href="?paged=<?php echo $current_page + 1; ?>"
			>
				Next
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

### Example 2: Tab-based navigation with state preservation

This example demonstrates tabs where the active tab content loads via client-side navigation while preserving local state.

**PHP (render.php):**
```php
<?php
$active_tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'overview';
$base_url = get_permalink();
?>

<div
	data-wp-interactive="myTabs"
	data-wp-router-region="tabbed-content"
	data-wp-context='{ "lastVisited": "" }'
>
	<nav class="tabs-nav">
		<a
			data-wp-on--click="actions.switchTab"
			data-wp-class--active="<?php echo $active_tab === 'overview' ? 'true' : 'false'; ?>"
			href="<?php echo esc_url( add_query_arg( 'tab', 'overview', $base_url ) ); ?>"
		>
			Overview
		</a>
		<a
			data-wp-on--click="actions.switchTab"
			data-wp-class--active="<?php echo $active_tab === 'details' ? 'true' : 'false'; ?>"
			href="<?php echo esc_url( add_query_arg( 'tab', 'details', $base_url ) ); ?>"
		>
			Details
		</a>
		<a
			data-wp-on--click="actions.switchTab"
			data-wp-class--active="<?php echo $active_tab === 'reviews' ? 'true' : 'false'; ?>"
			href="<?php echo esc_url( add_query_arg( 'tab', 'reviews', $base_url ) ); ?>"
		>
			Reviews
		</a>
	</nav>

	<div class="tab-content">
		<?php if ( $active_tab === 'overview' ) : ?>
			<h2>Overview</h2>
			<p>Product overview content...</p>
		<?php elseif ( $active_tab === 'details' ) : ?>
			<h2>Details</h2>
			<p>Product details content...</p>
		<?php else : ?>
			<h2>Reviews</h2>
			<p>Product reviews content...</p>
		<?php endif; ?>
	</div>

	<p data-wp-text="state.visitMessage"></p>
</div>
```

**JavaScript (view.js):**
```js
import { store, getContext, withSyncEvent } from '@wordpress/interactivity';

const { state } = store( 'myTabs', {
	state: {
		get visitMessage() {
			const { lastVisited } = getContext();
			return lastVisited
				? `You previously visited: ${ lastVisited }`
				: 'Welcome!';
		},
	},
	actions: {
		switchTab: withSyncEvent( function* ( event ) {
			event.preventDefault();

			// Update context before navigation (this persists).
			const context = getContext();
			const currentUrl = new URL( window.location.href );
			context.lastVisited =
				currentUrl.searchParams.get( 'tab' ) || 'overview';

			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( event.target.href );
		} ),
	},
} );
```

### Example 3: Infinite scroll

This example shows how to implement infinite scroll loading.

**PHP (render.php):**
```php
<?php
$page = isset( $_GET['page'] ) ? (int) $_GET['page'] : 1;
$items = get_items_for_page( $page );
$has_more = has_more_items( $page );
$next_url = add_query_arg( 'page', $page + 1, get_permalink() );

wp_interactivity_state( 'myInfiniteScroll', array(
	'hasMore' => $has_more,
	'nextUrl' => $next_url,
	'isLoading' => false,
) );
?>

<div
	data-wp-interactive="myInfiniteScroll"
	data-wp-router-region="infinite-list"
>
	<ul class="items-list">
		<?php foreach ( $items as $item ) : ?>
			<li><?php echo esc_html( $item['title'] ); ?></li>
		<?php endforeach; ?>
	</ul>

	<div
		data-wp-bind--hidden="!state.hasMore"
		data-wp-watch="callbacks.observeLoadMore"
	>
		<span data-wp-bind--hidden="!state.isLoading">Loading more...</span>
		<button
			data-wp-on--click="actions.loadMore"
			data-wp-bind--disabled="state.isLoading"
		>
			Load More
		</button>
	</div>
</div>
```

**JavaScript (view.js):**
```js
import { store, getElement } from '@wordpress/interactivity';

const { state } = store( 'myInfiniteScroll', {
	actions: {
		*loadMore() {
			if ( state.isLoading || ! state.hasMore ) {
				return;
			}

			state.isLoading = true;

			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( state.nextUrl, {
				// Replace history so back button works correctly.
				replace: true,
			} );

			state.isLoading = false;
		},
	},
	callbacks: {
		observeLoadMore() {
			const { ref } = getElement();

			// Use Intersection Observer for automatic loading.
			const observer = new IntersectionObserver(
				( entries ) => {
					if ( entries[ 0 ].isIntersecting ) {
						store( 'myInfiniteScroll' ).actions.loadMore();
					}
				},
				{ rootMargin: '100px' }
			);

			observer.observe( ref );

			// Cleanup function.
			return () => observer.disconnect();
		},
	},
} );
```

### Example 4: Handling navigation errors

This example demonstrates proper error handling during navigation.

```js
import { store, withSyncEvent } from '@wordpress/interactivity';

const { state } = store( 'myPlugin', {
	state: {
		error: null,
		isNavigating: false,
	},
	actions: {
		navigate: withSyncEvent( function* ( event ) {
			event.preventDefault();
			state.error = null;
			state.isNavigating = true;

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
			} finally {
				state.isNavigating = false;
			}
		} ),
	},
} );
```

```html
<div data-wp-interactive="myPlugin">
	<div
		data-wp-bind--hidden="!state.error"
		class="error-message"
		data-wp-text="state.error"
	></div>

	<a
		data-wp-on--click="actions.navigate"
		data-wp-class--is-loading="state.isNavigating"
		href="/another-page/"
	>
		Navigate
	</a>
</div>
```

## Disabling client-side navigation

There are scenarios where you may need to disable client-side navigation and force a full page reload. The Interactivity API provides a configuration option for this.

### Using wp_interactivity_config

In PHP, use `wp_interactivity_config()` to disable client-side navigation:

```php
// Disable client navigation for this page.
wp_interactivity_config(
	'core/router',
	array( 'clientNavigationDisabled' => true )
);
```

When `clientNavigationDisabled` is set to `true`:

- Calls to `actions.navigate()` will trigger a full page reload instead of client-side navigation.
- Calls to `actions.prefetch()` will do nothing.
- If a user navigates to a page with this configuration, the router will force a page reload.

### Use cases for disabling client navigation

- **Plugin incompatibility**: When third-party plugins require full page reloads.
- **Complex state resets**: When you need to ensure all JavaScript state is completely reset.
- **Admin pages**: When the full WordPress admin experience is needed.
- **Specific page types**: When certain pages have special requirements that conflict with client-side navigation.

## Synchronizing with server data

When using client-side navigation, the global state and local context are preserved on the client. However, the server may provide updated data for each page. The Interactivity API provides `getServerState()` and `getServerContext()` functions to help synchronize client state with server-provided data.

_Please, visit the [Understanding global state, local context and derived state](/docs/reference-guides/interactivity-api/core-concepts/undestanding-global-state-local-context-and-derived-state.md#subscribing-to-server-state-and-context) guide to learn more about `getServerState()` and `getServerContext()`._

### Example: Updating state after navigation

```js
import {
	store,
	getContext,
	getServerState,
	getServerContext,
} from '@wordpress/interactivity';

const { state } = store( 'myPlugin', {
	callbacks: {
		// This callback watches for server state changes.
		syncWithServer() {
			const serverState = getServerState();
			const serverContext = getServerContext();
			const context = getContext();

			// Selectively update what you need from the server.
			if ( serverState.pageTitle ) {
				state.pageTitle = serverState.pageTitle;
			}

			if ( serverContext.itemCount !== undefined ) {
				context.itemCount = serverContext.itemCount;
			}
		},
	},
} );
```

## Best practices

### 1. Keep regions focused

Define router regions around the content that actually changes between pages. Avoid wrapping the entire page in a single region.

```html
<!-- Good: Specific regions for changing content -->
<header data-wp-interactive="myTheme" data-wp-router-region="header">
	<nav><!-- Navigation that might show active states --></nav>
</header>

<main data-wp-interactive="myTheme" data-wp-router-region="main-content">
	<!-- Main content that changes between pages -->
</main>

<!-- Avoid: One giant region -->
<body data-wp-interactive="myTheme" data-wp-router-region="everything">
	<!-- This defeats the purpose of partial updates -->
</body>
```

### 2. Use consistent region IDs

Ensure region IDs are consistent across all pages where they should be updated. Use namespaced IDs to avoid conflicts.

```html
<!-- Good: Namespaced, descriptive IDs -->
<div data-wp-router-region="myPlugin/product-list">...</div>
<div data-wp-router-region="myPlugin/sidebar">...</div>

<!-- Avoid: Generic IDs that might conflict -->
<div data-wp-router-region="content">...</div>
<div data-wp-router-region="sidebar">...</div>
```

### 3. Prefetch strategically

Prefetch pages that users are likely to visit, but avoid prefetching everything. Good candidates for prefetching include:

- Links on hover (most common pattern)
- "Next" links in pagination
- Primary navigation items on viewport visibility

```js
store( 'myPlugin', {
	actions: {
		*prefetchOnHover( event ) {
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.prefetch( event.target.href );
		},
	},
} );
```

### 4. Handle loading states gracefully

Always provide visual feedback during navigation. Use the router's built-in state or manage your own loading indicators.

### 5. Test back/forward navigation

Ensure your interactive blocks work correctly when users use browser back/forward buttons. The router automatically handles caching, but your state management should account for these navigation patterns.

### 6. Consider accessibility

The router provides screen reader announcements by default. Keep this enabled unless you have a specific reason to disable it and are providing your own accessibility handling.

## Conclusion

Client-side navigation with the Interactivity API provides a powerful way to create faster, more responsive WordPress sites while maintaining the benefits of server-side rendering. By using router regions to define what changes between pages, prefetching to anticipate user navigation, and proper state management, you can create experiences that feel instant and app-like.

Key takeaways:

- Use `data-wp-router-region` to mark content that should be updated during navigation.
- Import the router dynamically with `yield import('@wordpress/interactivity-router')` to minimize initial bundle size.
- Use `actions.navigate()` for programmatic navigation and `actions.prefetch()` for preloading.
- Leverage `state.navigation.hasStarted` and `state.navigation.hasFinished` for loading states.
- Use `attachTo` for regions that should be dynamically injected into the DOM.
- Consider using `getServerState()` and `getServerContext()` to synchronize with server-provided data after navigation.
