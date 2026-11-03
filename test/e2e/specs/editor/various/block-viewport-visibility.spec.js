import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'Block viewport visibility', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'shows a block hidden on desktop while the canvas is tablet-sized', async ( {
		editor,
		page,
	} ) => {
		// Wider than the tablet breakpoint (782px), while the open settings
		// sidebar makes the canvas narrower than it.
		await page.setViewportSize( { width: 1000, height: 800 } );
		await editor.openDocumentSettingsSidebar();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Always visible' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Hidden on desktop',
				metadata: { blockVisibility: { viewport: { desktop: false } } },
			},
		} );
		await editor.saveDraft();

		// Reload so no block is selected: a selected hidden block still renders.
		await page.reload();
		await expect(
			editor.canvas.getByText( 'Always visible', { exact: true } )
		).toBeVisible();

		const canvasWidth = await editor.canvas
			.locator( 'body' )
			.evaluate( ( body ) => body.ownerDocument.defaultView.innerWidth );
		expect( canvasWidth ).toBeGreaterThan( 480 );
		expect( canvasWidth ).toBeLessThanOrEqual( 782 );
		expect( await page.evaluate( () => window.innerWidth ) ).toBe( 1000 );

		await expect(
			editor.canvas.getByText( 'Hidden on desktop', { exact: true } )
		).toBeVisible();
	} );
} );
