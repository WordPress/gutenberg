/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Table of Contents', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should be populated with existing headings when inserted', async ( {
		editor,
	} ) => {
		// Insert three heading blocks.
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Heading 1', level: 2 },
		} );
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Heading 2', level: 2 },
		} );
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Heading 3', level: 3 },
		} );
		await editor.insertBlock( { name: 'core/table-of-contents' } );

		// Verify the ToC block exists and contains headings.
		const tocBlock = editor.canvas.locator(
			'[data-type="core/table-of-contents"]'
		);
		await expect( tocBlock ).toBeVisible();
		await expect(
			tocBlock.getByRole( 'link', { name: 'Heading 1' } )
		).toBeVisible();
		await expect(
			tocBlock.getByRole( 'link', { name: 'Heading 2' } )
		).toBeVisible();
		await expect(
			tocBlock.getByRole( 'link', { name: 'Heading 3' } )
		).toBeVisible();
	} );

	test( 'should update automatically when new heading blocks are inserted', async ( {
		editor,
	} ) => {
		// Insert initial heading and ToC block.
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'First Heading', level: 2 },
		} );
		await editor.insertBlock( { name: 'core/table-of-contents' } );

		const tocBlock = editor.canvas.locator(
			'[data-type="core/table-of-contents"]'
		);
		await expect(
			tocBlock.getByRole( 'link', { name: 'First Heading' } )
		).toBeVisible();

		// Add a new heading after the ToC.
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'New Heading', level: 2 },
		} );

		// Verify the ToC is updated automatically.
		await expect(
			tocBlock.getByRole( 'link', { name: 'New Heading' } )
		).toBeVisible();
	} );

	test( 'should update automatically when heading text is changed', async ( {
		editor,
		page,
	} ) => {
		// Insert heading and ToC.
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Original Title', level: 2 },
		} );
		await editor.insertBlock( { name: 'core/table-of-contents' } );

		const tocBlock = editor.canvas.locator(
			'[data-type="core/table-of-contents"]'
		);
		await expect(
			tocBlock.getByRole( 'link', { name: 'Original Title' } )
		).toBeVisible();

		// Modify the heading block.
		const headingBlock = editor.canvas.locator(
			'[data-type="core/heading"]'
		);
		await headingBlock.click();
		await page.keyboard.press( 'End' );
		for ( let i = 0; i < 5; i++ ) {
			await page.keyboard.press( 'Backspace' );
		}
		await page.keyboard.type( 'Updated' );

		// Verify ToC updates.
		await expect(
			tocBlock.getByRole( 'link', { name: 'Original Updated' } )
		).toBeVisible();
	} );

	test( 'should update automatically when heading anchor is changed', async ( {
		editor,
		page,
	} ) => {
		// Insert heading and ToC.
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Anchor Test', level: 2 },
		} );
		await editor.insertBlock( { name: 'core/table-of-contents' } );

		const tocBlock = editor.canvas.locator(
			'[data-type="core/table-of-contents"]'
		);

		// Add a custom anchor.
		await editor.selectBlocks(
			editor.canvas.locator( '[data-type="core/heading"]' )
		);
		await editor.openDocumentSettingsSidebar();

		const advancedPanel = page.getByRole( 'button', { name: 'Advanced' } );
		await advancedPanel.click();
		await page.getByLabel( 'HTML anchor' ).fill( 'custom-anchor' );

		// Verify the anchor in ToC link has updated.
		const updatedLink = tocBlock.getByRole( 'link', {
			name: 'Anchor Test',
		} );
		expect( await updatedLink.getAttribute( 'href' ) ).toContain(
			'#custom-anchor'
		);
	} );

	test( 'should update automatically when heading order is changed', async ( {
		editor,
		page,
	} ) => {
		// Insert three heading blocks in order.
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'First Heading', level: 2 },
		} );
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Second Heading', level: 2 },
		} );
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Third Heading', level: 2 },
		} );
		await editor.insertBlock( { name: 'core/table-of-contents' } );

		// Move the first heading down.
		await editor.selectBlocks(
			editor.canvas.locator(
				'[data-type="core/heading"]:has-text("First Heading")'
			)
		);

		// Use the block mover in the toolbar.
		await page
			.getByRole( 'toolbar' )
			.getByRole( 'button', { name: 'Move down' } )
			.click();
		await page
			.getByRole( 'toolbar' )
			.getByRole( 'button', { name: 'Move down' } )
			.click();

		// Verify blocks were reordered.
		const blocks = await editor.getBlocks();
		const headingBlocks = blocks.filter(
			( block ) => block.name === 'core/heading'
		);

		expect( headingBlocks[ 0 ].attributes.content ).toBe(
			'Second Heading'
		);
		expect( headingBlocks[ 1 ].attributes.content ).toBe( 'Third Heading' );
		expect( headingBlocks[ 2 ].attributes.content ).toBe( 'First Heading' );

		// Click the ToC to ensure focus and force update.
		await editor.canvas
			.locator( '[data-type="core/table-of-contents"]' )
			.click();

		// Get the current ToC links.
		const tocBlock = editor.canvas.locator(
			'[data-type="core/table-of-contents"]'
		);
		const links = await tocBlock.getByRole( 'link' ).all();
		const texts = await Promise.all(
			links.map( ( link ) => link.textContent() )
		);

		// Verify the updated order.
		expect( texts[ 0 ] ).toBe( 'Second Heading' );
		expect( texts[ 1 ] ).toBe( 'Third Heading' );
		expect( texts[ 2 ] ).toBe( 'First Heading' );
	} );
} );
