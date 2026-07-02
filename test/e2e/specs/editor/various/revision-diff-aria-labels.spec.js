/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Revision block diff aria-labels', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should announce the diff status of added, removed and modified blocks', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Unchanged paragraph' },
		} );
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Heading to remove' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph before modification' },
		} );

		// Save draft to create the first revision.
		await editor.saveDraft();

		// Remove the heading, modify the last paragraph, and add a new block.
		await page.evaluate( () => {
			const { select, dispatch } = window.wp.data;
			const blocks = select( 'core/block-editor' ).getBlocks();
			dispatch( 'core/block-editor' ).removeBlock( blocks[ 1 ].clientId );
			dispatch( 'core/block-editor' ).updateBlockAttributes(
				blocks[ 2 ].clientId,
				{ content: 'Paragraph after modification' }
			);
			dispatch( 'core/block-editor' ).insertBlocks(
				window.wp.blocks.createBlock( 'core/verse', {
					content: 'Newly added verse',
				} )
			);
			// A Group block matching the "Row" variation, to check that
			// diff labels use the variation-aware title.
			dispatch( 'core/block-editor' ).insertBlocks(
				window.wp.blocks.createBlock(
					'core/group',
					{ layout: { type: 'flex', flexWrap: 'nowrap' } },
					[
						window.wp.blocks.createBlock( 'core/paragraph', {
							content: 'Inside the row',
						} ),
					]
				)
			);
		} );

		// Save draft again to create the second revision.
		await editor.saveDraft();

		// Open revisions.
		await editor.openDocumentSettingsSidebar();
		const settingsSidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settingsSidebar.getByRole( 'tab', { name: 'Post' } ).click();
		await settingsSidebar
			.getByRole( 'button', {
				name: 'Open revisions screen: 2 revisions',
			} )
			.click();

		// Wait for revisions mode.
		await expect(
			page.getByRole( 'button', { name: 'Restore' } )
		).toBeVisible();

		// Blocks announce their diff status via the accessible name.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Modified Block: Paragraph',
			} )
		).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Removed Block: Heading',
			} )
		).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Added Block: Poetry',
			} )
		).toBeVisible();

		// Diff labels use the variation-aware block title.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Added Block: Row',
			} )
		).toBeVisible();

		// The unchanged block keeps the default label.
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Block: Paragraph',
					exact: true,
				} )
				.filter( { hasText: 'Unchanged paragraph' } )
		).toBeVisible();
	} );
} );
