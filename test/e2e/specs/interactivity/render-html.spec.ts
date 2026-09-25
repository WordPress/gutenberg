/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'renderHTML', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		// Post B renders the same router region (`test/region`) with server
		// content (the block's `region` variant); post A loads a fragment
		// carrying that region via `renderHTML()`, then navigates to B to
		// test the swap.
		const regionUrl = await utils.addPostWithBlock( 'test/render-html', {
			alias: 'render html - region',
			attributes: { region: true },
		} );
		await utils.addPostWithBlock( 'test/render-html', {
			alias: 'render html - main',
			attributes: { next: regionUrl },
		} );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'render html - main' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'inserted plain fragment is fully interactive and inherits the island context', async ( {
		page,
	} ) => {
		const counter = page.getByTestId( 'counter' );
		await expect( counter ).toHaveCount( 0 );

		await page.getByTestId( 'load' ).click();

		await expect( counter ).toBeVisible();
		await expect( counter ).toHaveText( '0' );

		// The fragment's counter reads the island's context.
		await counter.click();
		await expect( counter ).toHaveText( '1' );

		await counter.click();
		await expect( counter ).toHaveText( '2' );

		// The island's own element must react to the fragment's write-through.
		await expect( page.getByTestId( 'block-count' ) ).toHaveText( '2' );

		await expect( page.getByTestId( 'hydrated' ) ).toHaveText( 'yes' );
	} );

	test( 'inserted self-contained island fragment is fully interactive', async ( {
		page,
	} ) => {
		const counter = page.getByTestId( 'island-counter' );
		await expect( counter ).toHaveCount( 0 );

		await page.getByTestId( 'load-island' ).click();

		await expect( counter ).toBeVisible();
		await expect( counter ).toHaveText( '0' );

		// The self-contained fragment has its own context, so it does not
		// affect the enclosing island's context.
		await counter.click();
		await expect( counter ).toHaveText( '1' );
		await expect( page.getByTestId( 'block-count' ) ).toHaveText( '0' );

		await expect( page.getByTestId( 'hydrated' ) ).toHaveText( 'yes' );
	} );

	test( 're-fetching with fresh server markup replaces the fragment', async ( {
		page,
	} ) => {
		await page.getByTestId( 'load' ).click();
		await expect( page.getByTestId( 'version' ) ).toHaveText( 'version 1' );

		// Reload fetches `?v=2` and replaces the fragment's nodes.
		await page.getByTestId( 'reload' ).click();
		await expect( page.getByTestId( 'version' ) ).toHaveText( 'version 2' );

		// The old fragment's nodes are gone.
		await expect( page.getByTestId( 'counter' ) ).toHaveCount( 0 );

		// The new fragment's nodes are hydrated (the reactive flag flipped).
		await expect( page.getByTestId( 'hydrated' ) ).toHaveText( 'yes' );
	} );

	test( 'fragment carrying data-wp-router-region is swappable on navigation', async ( {
		page,
	} ) => {
		await page.getByTestId( 'load-region' ).click();
		await expect( page.getByTestId( 'region-fragment' ) ).toHaveText(
			'fragment content'
		);

		// Navigate to the page with the same region ID: the region's content
		// is swapped with the server content.
		await page.getByTestId( 'nav-region' ).click();
		await expect( page.getByTestId( 'region-server' ) ).toHaveText(
			'server content'
		);
		await expect( page.getByTestId( 'region-fragment' ) ).toHaveCount( 0 );
	} );

	test( 'renderHTML preserves text nodes in mixed content', async ( {
		page,
	} ) => {
		const target = page.getByTestId( 'target' );
		await page.getByTestId( 'load-mixed' ).click();
		await expect( page.getByTestId( 'mixed-span' ) ).toHaveText( 'a' );
		await expect( target ).toContainText( 'and text' );
	} );

	test( 'removing a renderHTML-inserted node cleans up its window listener', async ( {
		page,
	} ) => {
		// Load a fragment with a window-resize listener.
		await page.getByTestId( 'load-listener' ).click();
		// The listener span is empty (zero-size) so `toBeVisible` is false;
		// assert presence instead.
		await expect( page.getByTestId( 'listener' ) ).toHaveCount( 1 );
		await expect( page.getByTestId( 'resize-count' ) ).toHaveText( '0' );

		// Replacing the fragment's content (`mode: 'inner'`) removes the
		// listener node; its window listener must be cleaned up.
		await page.getByTestId( 'reload' ).click();
		await expect( page.getByTestId( 'version' ) ).toHaveText( 'version 2' );
		await expect( page.getByTestId( 'listener' ) ).toHaveCount( 0 );

		// Dispatching resize must NOT fire the removed node's listener.
		await page.evaluate( () =>
			window.dispatchEvent( new Event( 'resize' ) )
		);
		await expect( page.getByTestId( 'resize-count' ) ).toHaveText( '0' );
	} );

	test( 'navigating away from a renderHTML-inserted region cleans up its window listener', async ( {
		page,
	} ) => {
		// Load a fragment that is a router region (without a listener inside).
		await page.getByTestId( 'load-region' ).click();
		await expect( page.getByTestId( 'region-fragment' ) ).toHaveText(
			'fragment content'
		);

		// Insert a window-listener node into the region's content as a
		// SEPARATE renderHTML fragment — the scenario where navigating away
		// must clean up that node's listeners.
		await page.getByTestId( 'load-listener-region' ).click();
		await expect( page.getByTestId( 'listener' ) ).toHaveCount( 1 );
		await expect( page.getByTestId( 'resize-count' ) ).toHaveText( '0' );

		// Navigate to the page with the same region ID: the region's content
		// is swapped, so the listener node is gone and its window listener
		// must have been cleaned up.
		await page.getByTestId( 'nav-region' ).click();
		await expect( page.getByTestId( 'region-server' ) ).toHaveText(
			'server content'
		);
		await expect( page.getByTestId( 'listener' ) ).toHaveCount( 0 );

		await page.evaluate( () =>
			window.dispatchEvent( new Event( 'resize' ) )
		);
		await expect( page.getByTestId( 'resize-count' ) ).toHaveText( '0' );
	} );

	test( 'prepends new content before the existing children', async ( {
		page,
	} ) => {
		// Load one fragment (appended), then prepend another: the new
		// content must land BEFORE the existing children.
		await page.getByTestId( 'load' ).click();
		await expect( page.getByTestId( 'counter' ) ).toBeVisible();

		await page.getByTestId( 'load-prepend' ).click();
		await expect( page.getByTestId( 'mixed-span' ) ).toBeVisible();

		const firstChild = page
			.getByTestId( 'target' )
			.locator( ':scope > *' )
			.first();
		await expect( firstChild ).toHaveAttribute(
			'data-testid',
			'mixed-span'
		);
	} );

	test( 'inserts content before the container', async ( { page } ) => {
		await page.getByTestId( 'load-before' ).click();
		await expect( page.getByTestId( 'mixed-span' ) ).toBeVisible();

		// The new content is a sibling immediately before the target.
		const isBefore = await page
			.getByTestId( 'mixed-span' )
			.evaluate(
				( el ) =>
					el.nextElementSibling?.getAttribute( 'data-testid' ) ===
					'target'
			);
		expect( isBefore ).toBe( true );
	} );

	test( 'inserts content after the container', async ( { page } ) => {
		await page.getByTestId( 'load-after' ).click();
		await expect( page.getByTestId( 'mixed-span' ) ).toBeVisible();

		// The new content is a sibling immediately after the target.
		const isAfter = await page
			.getByTestId( 'mixed-span' )
			.evaluate(
				( el ) =>
					el.previousElementSibling?.getAttribute( 'data-testid' ) ===
					'target'
			);
		expect( isAfter ).toBe( true );
	} );

	test( 'replaces the container itself with the new content', async ( {
		page,
	} ) => {
		await page.getByTestId( 'load-replace' ).click();
		await expect( page.getByTestId( 'mixed-span' ) ).toBeVisible();
		await expect( page.getByTestId( 'target' ) ).toHaveCount( 0 );
	} );

	test( 'splicing into a container inside a nested island keeps a single tree', async ( {
		page,
	} ) => {
		await page.getByTestId( 'load-nested' ).click();
		await expect( page.getByTestId( 'nested-island' ) ).toBeVisible();

		// The nested island's SSR content initialized exactly once.
		await expect( page.getByTestId( 'nested-count' ) ).toHaveText( '1' );

		// Splicing into a container inside the nested island must NOT create
		// a second tree (which would re-run the nested island's init).
		await page.getByTestId( 'render-into-nested' ).click();
		await expect( page.getByTestId( 'nested-btn' ) ).toBeVisible();
		await expect( page.getByTestId( 'nested-count' ) ).toHaveText( '1' );

		// The inserted button resolves the NESTED namespace's store.
		await page.getByTestId( 'nested-btn' ).click();
		await expect( page.getByTestId( 'nested-btn' ) ).toHaveText( '1' );
	} );
} );

test.describe( 'renderHTML overlapping re-renders', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		// The first describe's afterAll deletes all posts, so re-create the
		// main post (which now also hosts the overlapping-re-render slots).
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/render-html', {
			alias: 'render html - main',
		} );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'render html - main' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 're-rendering a subset of previously rendered elements keeps the other siblings', async ( {
		page,
	} ) => {
		await page.getByTestId( 'load-two' ).click();
		await expect( page.getByTestId( 'item-a' ) ).toBeVisible();
		await expect( page.getByTestId( 'item-b' ) ).toBeVisible();

		// Re-render only slot A with fresh markup. Slot B must stay in the
		// DOM — a splice targets a single container.
		await page.getByTestId( 'shrink' ).click();
		await expect( page.getByTestId( 'item-b' ) ).toBeVisible();
		await expect( page.getByTestId( 'item-b' ) ).toHaveText( '0' );

		// Both elements stay interactive and share the island's context.
		await page.getByTestId( 'item-a' ).click();
		await expect( page.getByTestId( 'item-a' ) ).toHaveText( '1' );

		// item-b was not part of the re-render, but it must remain live and
		// react to the shared context.
		await expect( page.getByTestId( 'item-b' ) ).toHaveText( '1' );
		await page.getByTestId( 'item-b' ).click();
		await expect( page.getByTestId( 'item-b' ) ).toHaveText( '2' );
	} );

	test( 're-rendering a superset of previously rendered elements does not duplicate nodes', async ( {
		page,
	} ) => {
		await page.getByTestId( 'load-one' ).click();
		await expect( page.getByTestId( 'item-a' ) ).toBeVisible();
		await expect( page.getByTestId( 'item-b' ) ).toHaveCount( 0 );

		// Grow to [item-a, item-b]: slot B gets its item. The new element
		// must be hydrated in place — exactly one instance, fully
		// interactive.
		await page.getByTestId( 'grow' ).click();
		await expect( page.getByTestId( 'item-b' ) ).toHaveCount( 1 );
		await expect( page.getByTestId( 'item-b' ) ).toHaveText( '0' );

		// Both elements are live and share the island's context.
		await page.getByTestId( 'item-a' ).click();
		await expect( page.getByTestId( 'item-a' ) ).toHaveText( '1' );
		await expect( page.getByTestId( 'item-b' ) ).toHaveText( '1' );
		await page.getByTestId( 'item-b' ).click();
		await expect( page.getByTestId( 'item-b' ) ).toHaveText( '2' );
	} );
} );
