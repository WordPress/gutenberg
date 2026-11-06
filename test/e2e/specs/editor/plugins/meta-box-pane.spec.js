const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function paneMetrics( page ) {
	return page.evaluate( () => {
		const content = document.querySelector(
			'.interface-interface-skeleton__content'
		);
		const pane = document.querySelector( '.edit-post-meta-boxes-main' );
		const canvas = document.querySelector( '.editor-visual-editor' );
		const contentHeight = content.getBoundingClientRect().height;
		return {
			contentHeight,
			paneHeight: pane ? pane.getBoundingClientRect().height : 0,
			canvasHeight: canvas.getBoundingClientRect().height,
		};
	} );
}

test.describe( 'Meta box pane', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-plugin-meta-box' );
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.setPreferences( 'core/edit-post', {
			metaBoxesMainIsPinned: false,
			metaBoxesMainIsOpen: false,
			metaBoxesMainOpenHeight: undefined,
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-plugin-meta-box' );
	} );

	test( 'shows meta boxes below the canvas until pinned', async ( {
		page,
	} ) => {
		const pane = page.locator( '.edit-post-meta-boxes-main' );
		await expect( pane ).toHaveClass( /is-inline/ );
		await expect( pane ).not.toHaveClass( /is-pinned/ );

		const { contentHeight, canvasHeight } = await paneMetrics( page );
		expect( canvasHeight ).toBeGreaterThan( contentHeight * 0.9 );

		const field = page.getByRole( 'textbox', {
			name: 'Test meta box field',
		} );
		const content = page.locator(
			'.interface-interface-skeleton__content'
		);
		const before = await field.boundingBox();
		const contentBox = await content.boundingBox();
		expect( before.y ).toBeGreaterThanOrEqual(
			contentBox.y + contentBox.height - 1
		);
		await field.scrollIntoViewIfNeeded();
		await expect( field ).toBeInViewport();
	} );

	test( 'opens at about half the content area on the first pin', async ( {
		page,
	} ) => {
		await page.getByRole( 'button', { name: 'Pin to bottom' } ).click();
		const pane = page.locator( '.edit-post-meta-boxes-main' );
		await expect( pane ).toHaveClass( /is-pinned/ );

		const { contentHeight, paneHeight, canvasHeight } =
			await paneMetrics( page );
		expect( paneHeight ).toBeGreaterThan( contentHeight * 0.45 );
		expect( paneHeight ).toBeLessThan( contentHeight * 0.6 );
		expect( canvasHeight ).toBeGreaterThan( contentHeight * 0.3 );
	} );

	test( 'restores a saved height capped at 80% of the content area', async ( {
		page,
		editor,
	} ) => {
		await editor.setPreferences( 'core/edit-post', {
			// No stored pin flag: a saved height alone keeps the pane pinned.
			metaBoxesMainIsPinned: undefined,
			metaBoxesMainOpenHeight: 5000,
			metaBoxesMainIsOpen: true,
		} );
		await page.reload();
		await page.locator( '.edit-post-meta-boxes-main' ).waitFor();

		const pane = page.locator( '.edit-post-meta-boxes-main' );
		await expect( pane ).toHaveClass( /is-pinned/ );

		const { contentHeight, paneHeight, canvasHeight } =
			await paneMetrics( page );
		expect( paneHeight ).toBeLessThanOrEqual( contentHeight * 0.8 + 8 );
		expect( paneHeight ).toBeGreaterThan( contentHeight * 0.7 );
		expect( canvasHeight ).toBeGreaterThan( contentHeight * 0.15 );
	} );

	test( 'pin and unpin persist across a reload', async ( { page } ) => {
		await page.getByRole( 'button', { name: 'Pin to bottom' } ).click();
		await expect(
			page.locator( '.edit-post-meta-boxes-main' )
		).toHaveClass( /is-pinned/ );

		await page.reload();
		await expect(
			page.locator( '.edit-post-meta-boxes-main' )
		).toHaveClass( /is-pinned/ );

		await page.getByRole( 'button', { name: 'Unpin' } ).click();
		await expect(
			page.locator( '.edit-post-meta-boxes-main' )
		).toHaveClass( /is-inline/ );

		await page.reload();
		await expect(
			page.locator( '.edit-post-meta-boxes-main' )
		).toHaveClass( /is-inline/ );
	} );
} );

test.describe( 'Meta box pane with only a sidebar meta box', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-side-meta-box'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-side-meta-box'
		);
	} );

	test( 'does not render the bottom meta box area', async ( {
		admin,
		page,
	} ) => {
		await admin.createNewPost();
		await expect(
			page.locator( '.edit-post-meta-boxes-main' )
		).toHaveCount( 0 );
		await expect(
			page.getByRole( 'button', { name: 'Pin to bottom' } )
		).toHaveCount( 0 );
	} );
} );

test.describe( 'Meta box pane with a tall meta box', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-tall-meta-box'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-tall-meta-box'
		);
	} );

	test( 'does not cover the canvas when pinned', async ( {
		admin,
		page,
	} ) => {
		await admin.createNewPost();
		await page.getByRole( 'button', { name: 'Pin to bottom' } ).click();

		const tall = page.locator( '#gutenberg-tall-meta-box' );
		await expect( tall ).toBeAttached();

		const { contentHeight, paneHeight, canvasHeight } =
			await paneMetrics( page );
		const tallHeight = await tall.evaluate(
			( element ) => element.getBoundingClientRect().height
		);

		expect( tallHeight ).toBeGreaterThan( paneHeight );
		expect( paneHeight ).toBeLessThan( contentHeight * 0.6 );
		expect( canvasHeight ).toBeGreaterThan( contentHeight * 0.3 );
	} );
} );
