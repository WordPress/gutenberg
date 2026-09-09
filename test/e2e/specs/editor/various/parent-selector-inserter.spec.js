const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// A 1x1 transparent GIF so the image blocks render without any media
// library setup.
const IMAGE_DATA_URI =
	'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

test.describe( 'Parent selector inserter', () => {
	test( 'adds an image after the selected one from the parent selector', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/gallery',
			innerBlocks: [
				{
					name: 'core/image',
					attributes: { url: IMAGE_DATA_URI, alt: 'First' },
				},
				{
					name: 'core/image',
					attributes: { url: IMAGE_DATA_URI, alt: 'Second' },
				},
			],
		} );
		await editor.canvas
			.locator( '[data-type="core/image"]' )
			.first()
			.click();

		await editor.showBlockToolbar();
		await page.locator( 'role=button[name="Add image"]' ).click();

		// The new empty image lands between the two, selected, showing its
		// media placeholder.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/gallery',
				innerBlocks: [
					{ name: 'core/image', attributes: { alt: 'First' } },
					{ name: 'core/image', attributes: { alt: '' } },
					{ name: 'core/image', attributes: { alt: 'Second' } },
				],
			},
		] );
	} );

	test( 'hides the parent selector inserter only inside text flow wrappers', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/group',
			attributes: { layout: { type: 'constrained' } },
			innerBlocks: [
				{ name: 'core/paragraph', attributes: { content: 'Text' } },
			],
		} );
		await editor.canvas.locator( '[data-type="core/paragraph"]' ).click();

		await editor.showBlockToolbar();
		const toolbar = page.locator( 'role=toolbar[name="Block tools"i]' );
		await expect(
			toolbar.locator( 'role=button[name="Select parent block: Group"]' )
		).toBeVisible();
		await expect(
			toolbar.locator( 'role=button[name="Add block"]' )
		).toBeVisible();

		// A list merges with the text flow: Enter continues it, so its
		// items get no inserter.
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/list',
			innerBlocks: [
				{ name: 'core/list-item', attributes: { content: 'one' } },
			],
		} );
		await editor.canvas.locator( '[data-type="core/list-item"]' ).click();

		await editor.showBlockToolbar();
		await expect(
			toolbar.locator( 'role=button[name="Select parent block: List"]' )
		).toBeVisible();
		await expect(
			toolbar.locator( 'role=button[name^="Add "]' )
		).toBeHidden();
	} );
} );
