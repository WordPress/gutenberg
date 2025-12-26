/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const ENDPOINT = [
	'/wp/v2/block-renderer',
	`rest_route=${ encodeURIComponent( '/wp/v2/block-renderer' ) }`,
];

function defer() {
	let resolve;
	const deferred = new Promise( ( res ) => {
		resolve = res;
	} );
	deferred.resolve = resolve;
	return deferred;
}

test.describe( 'Server-side rendered block', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-server-side-rendered-block'
		);
	} );
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'test/server-side-rendered-block' } );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-server-side-rendered-block'
		);
	} );

	test( 'displays updated content after changing the block attributes', async ( {
		editor,
		page,
	} ) => {
		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Test Server-Side Render',
		} );

		await page.getByRole( 'spinbutton', { name: 'Count' } ).fill( '1' );
		await expect( block ).toHaveText( 'Coffee count: 1' );
	} );

	test( 'displays an error message when the server-side render request fails', async ( {
		editor,
		context,
		page,
	} ) => {
		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Test Server-Side Render',
		} );

		await expect( block ).toHaveText( 'Coffee count: 0' );

		await context.setOffline( true );
		await page.getByRole( 'spinbutton', { name: 'Count' } ).fill( '5' );

		await expect( block ).toContainText( 'Error loading block' );
	} );

	test( 'displays a special placeholder when the request returns an empty successful response', async ( {
		editor,
		page,
	} ) => {
		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Test Server-Side Render',
		} );

		await expect( block ).toHaveText( 'Coffee count: 0' );

		// Input more than maximum value to trigger empty response.
		await page.getByRole( 'spinbutton', { name: 'Count' } ).fill( '20' );
		await expect( block ).toHaveText( 'Block rendered as empty.' );
	} );

	test( 'displays previous content followed by a loading spinner after a slight delay', async ( {
		editor,
		page,
	} ) => {
		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Test Server-Side Render',
		} );
		const deferred = defer();

		await expect( block ).toHaveText( 'Coffee count: 0' );
		await page.route(
			( url ) => ENDPOINT.some( ( u ) => url.href.includes( u ) ),
			async ( route ) => {
				await deferred;
				await route.continue();
			}
		);

		await page.getByRole( 'spinbutton', { name: 'Count' } ).fill( '3' );

		await expect( block.locator( '.components-spinner' ) ).toBeVisible();
		await expect( block ).toHaveText( 'Coffee count: 0' );
		await deferred.resolve();
		await expect( block ).toHaveText( 'Coffee count: 3' );
	} );
} );

test.describe( 'PHP-only auto-register blocks', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-server-side-rendered-block'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-server-side-rendered-block'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should register blocks with auto_register flag', async ( {
		editor,
	} ) => {
		// Block with auto_register flag should be insertable
		await editor.insertBlock( { name: 'test/auto-register-block' } );

		const block = editor.canvas.getByText( 'Auto-register block content' );
		await expect( block ).toBeVisible();

		// Verify the auto-registered block uses API version 3
		// (minimum version set if not specified or registered with version < 3)
		const blockType = await editor.page.evaluate( () => {
			return window.wp.blocks.getBlockType( 'test/auto-register-block' );
		} );
		expect( blockType.apiVersion ).toBe( 3 );

		// Block without auto_register flag should NOT exist in registry
		const blockExists = await editor.page.evaluate( () => {
			return (
				window.wp.blocks.getBlockType(
					'test/php-only-no-auto-register'
				) !== undefined
			);
		} );
		expect( blockExists ).toBe( false );
	} );

	test( 'should use PHP-defined metadata (title, icon, category, keywords) for auto-registered blocks', async ( {
		page,
	} ) => {
		// Open the inserter
		await page.getByRole( 'button', { name: 'Block Inserter' } ).click();

		// Search using the custom title defined in PHP
		await page
			.getByRole( 'searchbox', { name: 'Search' } )
			.fill( 'Auto Register Test Block' );

		// Verify the block appears with the custom title
		const blockOption = page.getByRole( 'option', {
			name: 'Auto Register Test Block',
		} );
		await expect( blockOption ).toBeVisible();

		// Verify block metadata is correctly set from PHP
		const blockType = await page.evaluate( () => {
			return window.wp.blocks.getBlockType( 'test/auto-register-block' );
		} );

		// These should match the PHP-defined values
		// Icon is normalized to object format by WordPress
		expect( blockType.title ).toBe( 'Auto Register Test Block' );
		expect( blockType.icon.src ).toBe( 'admin-generic' );
		expect( blockType.category ).toBe( 'widgets' );
		expect( blockType.description ).toBe(
			'A test block for auto-registration'
		);
		expect( blockType.keywords ).toContain( 'serverblock' );
		expect( blockType.keywords ).toContain( 'autotest' );
	} );

	test( 'should render server-side content for auto-registered blocks with block supports', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'test/auto-register-block',
		} );

		const block = editor.canvas.getByText( 'Auto-register block content' );
		await expect( block ).toBeVisible();

		// Verify default background value is shown
		const backgroundText = editor.canvas.getByText( 'Background: default' );
		await expect( backgroundText ).toBeVisible();

		// Verify block has proper wrapper classes
		const blockWrapper = editor.canvas.locator( '.auto-register-example' );
		await expect( blockWrapper ).toBeVisible();

		// Verify the block wrapper has the wp-block class applied
		const wpBlockClass = editor.canvas
			.locator( '.wp-block-test-auto-register-block' )
			.first();
		await expect( wpBlockClass ).toBeVisible();

		// Change the background color and get its name
		await blockWrapper.click();
		await editor.openDocumentSettingsSidebar();

		const colorsButton = page.getByRole( 'button', { name: /Color/i } );
		await colorsButton.click();

		const backgroundButton = page.getByRole( 'button', {
			name: /Background/i,
		} );
		await backgroundButton.click();
		const firstColor = page.getByRole( 'option' ).first();
		const colorName = await firstColor.getAttribute( 'aria-label' );
		await firstColor.click();

		// Verify background is no longer 'default'
		await expect( backgroundText ).toBeHidden();

		// Verify the selected color appears in the block content
		const colorText = editor.canvas.getByText(
			`Background: ${ colorName.toLowerCase().replace( /\s+/g, '-' ) }`
		);
		await expect( colorText ).toBeVisible();
	} );
} );
