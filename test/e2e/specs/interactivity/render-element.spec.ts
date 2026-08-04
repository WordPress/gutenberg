/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'renderElement', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		// Post B renders the same router region (`test/region`) with server
		// content; post A loads a fragment carrying that region via
		// `renderElement()`, then navigates to B to test the swap.
		const regionUrl = await utils.addPostWithBlock(
			'test/render-element-region',
			{ alias: 'render element - region' }
		);
		await utils.addPostWithBlock( 'test/render-element', {
			alias: 'render element - main',
			attributes: { next: regionUrl },
		} );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'render element - main' ) );
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

	test( 'renders a data-wp-each list fragment and its items are interactive', async ( {
		page,
	} ) => {
		const items = page.getByTestId( 'item' );
		await expect( items ).toHaveCount( 0 );

		await page.getByTestId( 'load-list' ).click();

		// The template's items render from `state.items`.
		await expect( items ).toHaveCount( 3 );
		await expect( items.nth( 0 ) ).toHaveText( 'one' );
		await expect( items.nth( 1 ) ).toHaveText( 'two' );
		await expect( items.nth( 2 ) ).toHaveText( 'three' );

		// The list is hydrated: `data-wp-each` re-renders when state changes.
		await page.getByTestId( 'add-item' ).click();
		await expect( items ).toHaveCount( 4 );
		await expect( items.nth( 3 ) ).toHaveText( 'item-4' );

		await expect( page.getByTestId( 'hydrated' ) ).toHaveText( 'yes' );
	} );

	test( 'runs lifecycle directives on inserted fragments', async ( {
		page,
	} ) => {
		await page.getByTestId( 'load-lifecycle' ).click();

		// `data-wp-init` fires on insertion and updates the text.
		await expect( page.getByTestId( 'lifecycle' ) ).toHaveText(
			'initialized'
		);

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

	test( 'inserts a fragment before the target with position "before"', async ( {
		page,
	} ) => {
		const target = page.getByTestId( 'target' );
		await expect( page.getByTestId( 'frag-before' ) ).toHaveCount( 0 );

		await page.getByTestId( 'load-before' ).click();

		// The fragment is hydrated (reads the island context)...
		const frag = page.getByTestId( 'frag-before' );
		await expect( frag ).toHaveText( '0' );

		// ...and is a sibling immediately before the target.
		await expect( frag ).toBeVisible();
		const beforeIsTarget = await frag.evaluate(
			( el ) => el.nextElementSibling?.getAttribute( 'data-testid' )
		);
		expect( beforeIsTarget ).toBe( 'target' );
		await expect( target ).toHaveCount( 1 );
	} );

	test( 'inserts a fragment after the target with position "after"', async ( {
		page,
	} ) => {
		const target = page.getByTestId( 'target' );
		await expect( page.getByTestId( 'frag-after' ) ).toHaveCount( 0 );

		await page.getByTestId( 'load-after' ).click();

		// The fragment is hydrated (reads the island context)...
		const frag = page.getByTestId( 'frag-after' );
		await expect( frag ).toHaveText( '0' );

		// ...and is a sibling immediately after the target.
		await expect( frag ).toBeVisible();
		const afterIsTarget = await frag.evaluate(
			( el ) => el.previousElementSibling?.getAttribute( 'data-testid' )
		);
		expect( afterIsTarget ).toBe( 'target' );
		await expect( target ).toHaveCount( 1 );
	} );

	test( 'replaces the target itself with position "outer"', async ( {
		page,
	} ) => {
		await expect( page.getByTestId( 'target' ) ).toHaveCount( 1 );
		await expect( page.getByTestId( 'frag-outer' ) ).toHaveCount( 0 );

		await page.getByTestId( 'load-outer' ).click();

		// The target is replaced by the fragment...
		await expect( page.getByTestId( 'target' ) ).toHaveCount( 0 );

		// ...which is hydrated (reads the island context).
		await expect( page.getByTestId( 'frag-outer' ) ).toHaveText( '0' );
	} );

	test( 'runs data-wp-watch on insertion and re-runs on state change', async ( {
		page,
	} ) => {
		await page.getByTestId( 'load-watch' ).click();

		// `data-wp-watch` runs when the node is created: the callback reads
		// `state.items` and updates `state.watchText`, which `data-wp-text`
		// displays.
		const watch = page.getByTestId( 'watch' );
		await expect( watch ).toHaveText( 'watched 3' );

		// Clicking the fragment's button mutates `state.items`, so the watch
		// re-runs and the text updates reactively.
		await page.getByTestId( 'watch-add' ).click();
		await expect( watch ).toHaveText( 'watched 4' );
	} );
} );
