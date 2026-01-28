const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Test for occ/rather-simple-panzoom block with iframeCompatMode support.
 */
test.describe( 'Panzoom Compat Mode Block', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-rather-simple-panzoom' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-rather-simple-panzoom' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should render occ/rather-simple-panzoom in compat mode iframe', async ( { editor, page } ) => {
		// Insert the panzoom block
		await editor.insertBlock( { name: 'occ/rather-simple-panzoom' } );

		// Wait for compat mode iframe to be attached in the editor canvas
		const compatIframe = editor.canvas.locator( 'iframe.block-editor-compat-mode-iframe__frame' );
		await expect( compatIframe ).toBeAttached( { timeout: 15000 } );

		// The iframe should become visible (loading state disappears)
		await expect( compatIframe ).toBeVisible( { timeout: 20000 } );

		// Use frameLocator for reliable frame access
		const compatFrame = editor.canvas.frameLocator( 'iframe.block-editor-compat-mode-iframe__frame' );

		// Wait for the compat mode editor container to exist in the iframe
		await expect( compatFrame.locator( '#compat-mode-editor' ) ).toBeAttached( { timeout: 15000 } );

		// Wait for the block wrapper to render inside the iframe
		await expect( compatFrame.locator( '.compat-mode-block-wrapper' ) ).toBeAttached( { timeout: 15000 } );

		// Wait for the block to be inserted (look for the data-type attribute)
		const blockElement = compatFrame.locator( '[data-type="occ/rather-simple-panzoom"]' );
		await expect( blockElement ).toBeAttached( { timeout: 20000 } );

		// Verify the block is visible
		await expect( blockElement ).toBeVisible( { timeout: 10000 } );

		// Check for the actual panzoom block content (the media placeholder or image)
		const blockContent = compatFrame.locator( '[data-type="occ/rather-simple-panzoom"] .wp-block-occ-rather-simple-panzoom, [data-type="occ/rather-simple-panzoom"] .components-placeholder' );
		await expect( blockContent ).toBeVisible( { timeout: 10000 } );
	} );

	test( 'should show block toolbar and inspector controls in parent editor', async ( { editor, page } ) => {
		// Insert the panzoom block
		await editor.insertBlock( { name: 'occ/rather-simple-panzoom' } );

		// Wait for compat mode iframe to become visible
		const compatIframe = editor.canvas.locator( 'iframe.block-editor-compat-mode-iframe__frame' );
		await expect( compatIframe ).toBeVisible( { timeout: 20000 } );

		// Verify CompatModeSlotFills container exists in the parent document (outside canvas)
		const slotFillsContainer = page.locator( '.block-editor-compat-mode-slot-fills' );
		await expect( slotFillsContainer ).toBeAttached( { timeout: 5000 } );

		// The block toolbar should be visible in the parent editor (not inside iframe)
		// The panzoom block has a MediaReplaceFlow in BlockControls which shows "Add Image"
		const blockToolbar = page.locator( '.block-editor-block-toolbar' );
		await expect( blockToolbar ).toBeVisible( { timeout: 5000 } );

		// Check for the MediaReplaceFlow button ("Add Image" or "Replace")
		const mediaButton = blockToolbar.getByRole( 'button', { name: /Add Image|Replace/ } );
		await expect( mediaButton ).toBeVisible( { timeout: 5000 } );

		// The inspector controls should show the block name in sidebar
		const inspector = page.locator( '.block-editor-block-inspector' );
		await expect( inspector.getByText( 'Rather Simple Panzoom' ) ).toBeVisible( { timeout: 5000 } );

		// The Settings panel from InspectorControls should be visible
		await expect( inspector.getByRole( 'button', { name: 'Settings' } ) ).toBeVisible( { timeout: 5000 } );
	} );

	test( 'should not have infinite render loop (renders stabilize)', async ( { editor, page } ) => {
		// Set up console log tracking for render loops
		let renderCount = 0;
		page.on( 'console', ( msg ) => {
			if ( msg.text().includes( 'BlockListWithBlock rendering' ) ) {
				renderCount++;
			}
		} );

		// Insert the panzoom block
		await editor.insertBlock( { name: 'occ/rather-simple-panzoom' } );

		// Wait for compat mode iframe to become visible
		const compatIframe = editor.canvas.locator( 'iframe.block-editor-compat-mode-iframe__frame' );
		await expect( compatIframe ).toBeVisible( { timeout: 20000 } );

		// Wait for things to stabilize
		await page.waitForTimeout( 2000 );

		// Reset count and measure renders over 3 seconds
		renderCount = 0;
		await page.waitForTimeout( 3000 );

		// Should have very few render logs after stabilization (not infinite)
		expect( renderCount ).toBeLessThan( 10 );
	} );
} );
