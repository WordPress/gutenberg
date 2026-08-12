/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Captured block controls', () => {
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/quote',
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'first line' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'second line' },
				},
			],
		} );
	} );

	test( 'shows the quote toolbar and inspector for a selected inner paragraph', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.getByText( 'first line' ).click();
		await editor.showBlockToolbar();

		const toolbar = page.getByRole( 'toolbar', { name: 'Block tools' } );
		await expect(
			toolbar.getByRole( 'button', { name: 'Quote', exact: true } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', {
				name: 'Show block tools: Paragraph',
			} )
		).toBeVisible();
		// The parent toolbar replaces the parent selector.
		await expect(
			toolbar.getByRole( 'button', { name: /Select parent block/ } )
		).toBeHidden();

		// The actual selection stays on the paragraph.
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSelectedBlock().name
				)
			)
			.toBe( 'core/paragraph' );

		await editor.openDocumentSettingsSidebar();
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'heading', { name: 'Quote', exact: true } )
		).toBeVisible();
	} );

	test( 'expands the paragraph controls from the tile and keeps them expanded within the quote', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.getByText( 'first line' ).click();
		await editor.showBlockToolbar();

		const toolbar = page.getByRole( 'toolbar', { name: 'Block tools' } );
		await toolbar
			.getByRole( 'button', { name: 'Show block tools: Paragraph' } )
			.click();

		await expect(
			toolbar.getByRole( 'button', { name: 'Paragraph', exact: true } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', {
				name: 'Select parent block: Quote',
			} )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', { name: /Show block tools/ } )
		).toBeHidden();

		// Moving to a sibling inside the quote keeps the controls expanded.
		await editor.canvas.getByText( 'second line' ).click();
		await editor.showBlockToolbar();
		await expect(
			toolbar.getByRole( 'button', { name: 'Paragraph', exact: true } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', { name: /Show block tools/ } )
		).toBeHidden();
	} );

	test( 'collapses the expanded controls when selection leaves the quote', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'outside' },
		} );
		await editor.canvas.getByText( 'first line' ).click();
		await editor.showBlockToolbar();

		const toolbar = page.getByRole( 'toolbar', { name: 'Block tools' } );
		await toolbar
			.getByRole( 'button', { name: 'Show block tools: Paragraph' } )
			.click();
		await expect(
			toolbar.getByRole( 'button', { name: 'Paragraph', exact: true } )
		).toBeVisible();

		// Leave the quote, then come back: collapsed again.
		await editor.canvas.getByText( 'outside' ).click();
		await editor.canvas.getByText( 'first line' ).click();
		await editor.showBlockToolbar();
		await expect(
			toolbar.getByRole( 'button', { name: 'Quote', exact: true } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', {
				name: 'Show block tools: Paragraph',
			} )
		).toBeVisible();
	} );

	test( 'selecting the quote itself collapses the expanded controls', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.getByText( 'first line' ).click();
		await editor.showBlockToolbar();

		const toolbar = page.getByRole( 'toolbar', { name: 'Block tools' } );
		await toolbar
			.getByRole( 'button', { name: 'Show block tools: Paragraph' } )
			.click();
		await toolbar
			.getByRole( 'button', { name: 'Select parent block: Quote' } )
			.click();

		// The quote's own toolbar, without a captured tile.
		await expect(
			toolbar.getByRole( 'button', { name: 'Quote', exact: true } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', { name: /Show block tools/ } )
		).toBeHidden();
	} );

	test( 'shows a multi-selection tile for a multi-selection within the quote', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas.getByText( 'first line' ).click();
		// Select all text, then all blocks within the quote.
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+a' );
		await editor.showBlockToolbar();

		const toolbar = page.getByRole( 'toolbar', { name: 'Block tools' } );
		await expect(
			toolbar.getByRole( 'button', { name: 'Quote', exact: true } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', {
				name: 'Show block tools: 2 blocks',
			} )
		).toBeVisible();
	} );
} );
