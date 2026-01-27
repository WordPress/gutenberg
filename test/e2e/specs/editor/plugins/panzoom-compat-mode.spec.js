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
		// Capture console logs
		page.on( 'console', ( msg ) => {
			if ( msg.text().includes( '[Block]' ) || msg.text().includes( 'iframeCompatMode' ) || msg.text().includes( '[Compat Mode]' ) ) {
				console.log( 'BROWSER:', msg.text() );
			}
		} );

		// Check block supports before inserting
		const blockSupports = await page.evaluate( () => {
			const blockType = wp.blocks.getBlockType( 'occ/rather-simple-panzoom' );
			return blockType ? {
				name: blockType.name,
				supports: blockType.supports,
				hasIframeCompatMode: blockType.supports?.iframeCompatMode
			} : null;
		} );
		console.log( 'Block supports:', JSON.stringify( blockSupports, null, 2 ) );

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

		// Wait a bit for blocks to be inserted
		await page.waitForTimeout( 2000 );

		// Check what's in the block editor store inside the iframe
		const iframeHandle = await compatIframe.elementHandle();
		const frame = await iframeHandle.contentFrame();
		const blocksInStore = await frame.evaluate( () => {
			return wp.data.select( 'core/block-editor' ).getBlocks().map( b => ( { name: b.name, clientId: b.clientId } ) );
		} );
		console.log( 'Blocks in compat mode store:', JSON.stringify( blocksInStore ) );

		// Also check the iframe HTML
		const editorHTML = await frame.locator( '#compat-mode-editor' ).innerHTML();
		console.log( 'Editor HTML:', editorHTML.substring( 0, 500 ) );

		// Wait for the block to be inserted (look for the data-type attribute)
		const blockElement = compatFrame.locator( '[data-type="occ/rather-simple-panzoom"]' );
		await expect( blockElement ).toBeAttached( { timeout: 20000 } );

		// Log what's in the iframe for debugging
		const iframeContent = await compatFrame.locator( '#compat-mode-editor' ).innerHTML();
		console.log( '=== IFRAME CONTENT ===' );
		console.log( iframeContent );
		console.log( '=== END IFRAME CONTENT ===' );

		// Verify the block is visible
		await expect( blockElement ).toBeVisible( { timeout: 10000 } );

		// Check for the actual panzoom block content (the media placeholder or image)
		const blockContent = compatFrame.locator( '[data-type="occ/rather-simple-panzoom"] .wp-block-occ-rather-simple-panzoom, [data-type="occ/rather-simple-panzoom"] .components-placeholder' );
		await expect( blockContent ).toBeVisible( { timeout: 10000 } );
	} );

	test( 'should not have infinite render loop (renders stabilize)', async ( { editor, page } ) => {
		// Set up console log tracking for the iframe
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

		// Wait for 2 seconds to let things stabilize
		await page.waitForTimeout( 2000 );

		// Reset count and measure renders over 3 seconds
		renderCount = 0;
		await page.waitForTimeout( 3000 );

		// Should have very few render logs after stabilization (not infinite)
		// Allow some re-renders for legitimate updates, but not an infinite loop
		console.log( `Render count in 3 seconds after stabilization: ${ renderCount }` );
		expect( renderCount ).toBeLessThan( 10 );
	} );
} );
