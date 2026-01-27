const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Compat Mode Block', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-compat-mode-block' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-compat-mode-block' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should register and render third-party block in compat mode iframe', async ( { editor, page } ) => {
		// Insert the compat mode block
		await editor.insertBlock( { name: 'test/compat-mode-block' } );

		// Wait for compat mode iframe to be attached in the editor canvas
		const compatIframe = editor.canvas.locator( 'iframe.block-editor-compat-mode-iframe__frame' );
		await expect( compatIframe ).toBeAttached( { timeout: 10000 } );

		// Get the actual frame element to inspect its contents
		const iframeHandle = await compatIframe.elementHandle();
		const frame = await iframeHandle.contentFrame();

		// Wait for the block wrapper to render inside the iframe
		const blockWrapper = frame.locator( '.compat-mode-block-wrapper' );
		await expect( blockWrapper ).toBeAttached( { timeout: 15000 } );

		// Verify the block content is rendered correctly
		const blockContent = await frame.locator( '.compat-mode-block-wrapper p' ).textContent();
		expect( blockContent ).toBe( 'Compat Mode Block: empty' );

		// Verify the block is registered with correct API version
		const blockDetails = await frame.evaluate( () => {
			const block = wp.blocks.getBlockType( 'test/compat-mode-block' );
			return block ? {
				name: block.name,
				apiVersion: block.apiVersion,
				hasEdit: typeof block.edit === 'function',
			} : null;
		} );

		expect( blockDetails ).not.toBeNull();
		expect( blockDetails.name ).toBe( 'test/compat-mode-block' );
		expect( blockDetails.apiVersion ).toBe( 3 );
		expect( blockDetails.hasEdit ).toBe( true );

		// Verify the iframe becomes visible (loading state disappears)
		await expect( compatIframe ).toBeVisible( { timeout: 10000 } );
	} );

	test( 'should handle block that throws an error', async ( { editor, page } ) => {
		// Insert the error block - this block throws an error when rendered
		await editor.insertBlock( { name: 'test/compat-mode-error-block' } );

		// Wait for compat mode iframe to be attached in the editor canvas
		const compatIframe = editor.canvas.locator( 'iframe.block-editor-compat-mode-iframe__frame' );
		await expect( compatIframe ).toBeAttached( { timeout: 10000 } );

		// The iframe should become visible (COMPAT_READY received or fallback timeout)
		await expect( compatIframe ).toBeVisible( { timeout: 20000 } );

		// Get the actual frame element to inspect its contents
		const iframeHandle = await compatIframe.elementHandle();
		const frame = await iframeHandle.contentFrame();

		// Wait for the compat mode editor container to exist in the iframe
		await expect( frame.locator( '#compat-mode-editor' ) ).toBeAttached( { timeout: 15000 } );

		// Verify the block editor initialized in the iframe
		// The block wrapper should exist even if the block errors
		await expect( frame.locator( '.compat-mode-block-wrapper' ) ).toBeAttached( { timeout: 15000 } );

		// Verify the block element is present (it may be in an error state)
		const blockElement = frame.locator( '[data-type="test/compat-mode-error-block"]' );
		await expect( blockElement ).toBeAttached( { timeout: 10000 } );

		// The block exists in the iframe, which means the compat mode is working
		// Error handling within the iframe is a separate concern
	} );

	test( 'should show Try Compatibility Mode button when block crashes', async ( { editor, page } ) => {
		// Insert the crash block (no iframeCompatMode support)
		await editor.insertBlock( { name: 'test/crash-block' } );

		// Wait for the crash warning to appear
		const crashWarning = editor.canvas.locator( '.block-editor-block-list__block-crash-warning' );
		await expect( crashWarning ).toBeVisible( { timeout: 10000 } );

		// Verify the warning message
		const warningText = await crashWarning.textContent();
		expect( warningText ).toContain( 'This block has encountered an error' );

		// Find and click the "Try Compatibility Mode" button
		const compatButton = crashWarning.locator( 'button', { hasText: 'Try Compatibility Mode' } );
		await expect( compatButton ).toBeVisible( { timeout: 5000 } );
		await compatButton.click();

		// Wait for compat mode iframe to appear after clicking the button
		const compatIframe = editor.canvas.locator( 'iframe.block-editor-compat-mode-iframe__frame' );
		await expect( compatIframe ).toBeAttached( { timeout: 10000 } );

		// The iframe should become visible
		await expect( compatIframe ).toBeVisible( { timeout: 10000 } );

		// Use frameLocator for more reliable frame access
		const compatFrame = editor.canvas.frameLocator( 'iframe.block-editor-compat-mode-iframe__frame' );

		// Wait for the compat mode editor container to exist in the iframe
		await expect( compatFrame.locator( '#compat-mode-editor' ) ).toBeAttached( { timeout: 10000 } );

		// The block will still error in compat mode. Check for either error state.
		const crashWarningInIframe = compatFrame.locator( '.block-editor-block-list__block-crash-warning' );
		const errorBoundary = compatFrame.locator( '.compat-mode-block-wrapper strong' );

		// Wait for either error state to appear
		await expect(
			crashWarningInIframe.or( errorBoundary )
		).toBeVisible( { timeout: 15000 } );

		// Verify error is shown (either crash warning or error boundary)
		const hasCrashWarning = await crashWarningInIframe.isVisible();
		if ( hasCrashWarning ) {
			const warningTextInIframe = await crashWarningInIframe.textContent();
			expect( warningTextInIframe ).toContain( 'This block has encountered an error' );
		} else {
			const errorText = await errorBoundary.textContent();
			expect( errorText ).toContain( 'Block Error' );
		}
	} );
} );
