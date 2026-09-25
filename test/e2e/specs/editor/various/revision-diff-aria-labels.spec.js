const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Revision block diff aria-labels', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should announce the diff status of added, removed and modified blocks', async ( {
		editor,
		page,
		pageUtils,
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

		// Remove the heading.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.click();
		await editor.clickBlockOptionsMenuItem( 'Delete' );

		// Modify the last paragraph.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Paragraph before modification' } )
			.click();
		await pageUtils.pressKeys( 'primary+a' );
		await page.keyboard.type( 'Paragraph after modification' );

		// Add a block at the end of the post.
		await editor.insertBlock( {
			name: 'core/verse',
			attributes: { content: 'Newly added verse' },
		} );

		// A Group block matching the "Row" variation, to check that diff
		// labels use the variation-aware title.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: { layout: { type: 'flex', flexWrap: 'nowrap' } },
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Inside the row' },
				},
			],
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
				name: 'Modified block: Paragraph',
			} )
		).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Removed block: Heading',
			} )
		).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Added block: Poetry',
			} )
		).toBeVisible();

		// Diff labels use the variation-aware block title.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Added block: Row',
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

		// Nested unchanged blocks don't inherit an ancestor's diff label.
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Block: Paragraph',
					exact: true,
				} )
				.filter( { hasText: 'Inside the row' } )
		).toBeVisible();

		const showChangesButton = page.getByRole( 'button', {
			name: 'Show changes',
		} );
		await expect( showChangesButton ).toHaveAttribute(
			'aria-pressed',
			'true'
		);

		await showChangesButton.click();
		await expect( showChangesButton ).toHaveAttribute(
			'aria-pressed',
			'false'
		);

		// Disabling diff highlighting restores the default labels. Assert the
		// restored labels first, so that the counts below can't pass simply
		// because the canvas has yet to render.
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Block: Paragraph',
					exact: true,
				} )
				.filter( { hasText: 'Paragraph after modification' } )
		).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Poetry',
				exact: true,
			} )
		).toBeVisible();
		// "Group" rather than "Row": the default wrapper labels skip variation
		// matching in preview mode.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Group',
				exact: true,
			} )
		).toBeVisible();

		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Modified block: Paragraph',
			} )
		).toHaveCount( 0 );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Removed block: Heading',
			} )
		).toHaveCount( 0 );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Added block: Poetry',
			} )
		).toHaveCount( 0 );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Added block: Row',
			} )
		).toHaveCount( 0 );
	} );
} );
