import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'Block viewport visibility', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'hides a block for the viewport of the canvas, not of the window', async ( {
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
				content: 'Hidden on tablet',
				metadata: { blockVisibility: { viewport: { tablet: false } } },
			},
		} );
		await editor.saveDraft();

		// Blocks mounted on load have no later render to correct a wrong
		// first match.
		await page.reload();
		await expect(
			editor.canvas.getByText( 'Always visible' )
		).toBeVisible();

		const canvasWidth = await editor.canvas
			.locator( 'body' )
			.evaluate( ( body ) => body.ownerDocument.defaultView.innerWidth );
		expect( canvasWidth ).toBeGreaterThan( 480 );
		expect( canvasWidth ).toBeLessThanOrEqual( 782 );
		expect( await page.evaluate( () => window.innerWidth ) ).toBe( 1000 );

		await expect(
			editor.canvas.getByText( 'Hidden on tablet' )
		).toBeHidden();
	} );
} );
