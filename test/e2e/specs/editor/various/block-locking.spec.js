const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block Locking', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can prevent removal', async ( { editor, page } ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'Some paragraph' );

		await editor.clickBlockOptionsMenuItem( 'Lock' );

		await page
			.getByRole( 'checkbox', { name: 'Lock removal', exact: true } )
			.click();
		await page
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.click();

		await expect(
			page.locator( 'role=menuitem[name="Delete"]' )
		).toBeHidden();
	} );

	test( 'can disable movement', async ( { editor, page } ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'First paragraph' );

		await page.keyboard.type( 'Enter' );
		await page.keyboard.type( 'Second paragraph' );

		await editor.clickBlockOptionsMenuItem( 'Lock' );

		await page
			.getByRole( 'checkbox', { name: 'Lock movement', exact: true } )
			.click();
		await page
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.click();

		// Hide options.
		await editor.clickBlockToolbarButton( 'Options' );

		// Drag handle is hidden.
		await expect( page.locator( 'role=button[name="Drag"]' ) ).toBeHidden();

		// Movers are hidden. No need to check for both.
		await expect(
			page.locator( 'role=button[name="Move up"]' )
		).toBeHidden();
	} );

	test( 'can lock everything', async ( { editor, page } ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'Some paragraph' );

		await editor.clickBlockOptionsMenuItem( 'Lock' );

		await page
			.getByRole( 'checkbox', { name: 'Lock all', exact: true } )
			.click();
		await page
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.click();

		expect( await editor.getEditedPostContent() )
			.toBe( `<!-- wp:paragraph {"lock":{"move":true,"remove":true}} -->
<p>Some paragraph</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'can unlock from toolbar', async ( { editor, page } ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'Some paragraph' );

		await editor.clickBlockOptionsMenuItem( 'Lock' );

		await page
			.getByRole( 'checkbox', { name: 'Lock all', exact: true } )
			.click();
		await page
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.click();

		await editor.clickBlockToolbarButton( 'Unlock' );
		await page
			.getByRole( 'checkbox', { name: 'Lock all', exact: true } )
			.click();
		await page
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.click();

		await expect(
			page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Lock', exact: true } )
		).toBeFocused();

		expect( await editor.getEditedPostContent() )
			.toBe( `<!-- wp:paragraph {"lock":{"move":false,"remove":false}} -->
<p>Some paragraph</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'can lock multiple blocks', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second paragraph' },
		} );
		const paragraphs = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await editor.selectBlocks( paragraphs.first(), paragraphs.last() );

		await editor.clickBlockOptionsMenuItem( 'Lock' );

		const modal = page.getByRole( 'dialog', { name: 'Lock blocks' } );
		await modal
			.getByRole( 'checkbox', { name: 'Lock all', exact: true } )
			.click();
		await modal
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { lock: { move: true, remove: true } },
			},
			{
				name: 'core/paragraph',
				attributes: { lock: { move: true, remove: true } },
			},
		] );
	} );

	test( 'can unlock multiple blocks', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'First paragraph',
				lock: { move: true, remove: true },
			},
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Second paragraph',
				lock: { move: true, remove: true },
			},
		} );
		const paragraphs = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await editor.selectBlocks( paragraphs.first(), paragraphs.last() );

		await editor.clickBlockOptionsMenuItem( 'Unlock' );

		const modal = page.getByRole( 'dialog', { name: 'Lock blocks' } );
		await modal
			.getByRole( 'checkbox', { name: 'Lock all', exact: true } )
			.click();
		await modal
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.click();

		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ attributes: { lock: { move: false, remove: false } } },
				{ attributes: { lock: { move: false, remove: false } } },
			] );
	} );

	test( 'keeps mixed settings when locking multiple blocks', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Movement locked',
				lock: { move: true, remove: false },
			},
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Unlocked' },
		} );
		const paragraphs = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await editor.selectBlocks( paragraphs.first(), paragraphs.last() );

		await editor.clickBlockOptionsMenuItem( 'Lock' );

		const modal = page.getByRole( 'dialog', { name: 'Lock blocks' } );
		const lockMovement = modal.getByRole( 'checkbox', {
			name: 'Lock movement',
			exact: true,
		} );
		const lockRemoval = modal.getByRole( 'checkbox', {
			name: 'Lock removal',
			exact: true,
		} );
		await expect( lockMovement ).toBeChecked( { indeterminate: true } );
		await expect( lockRemoval ).not.toBeChecked();
		await expect(
			modal.getByText( 'Selected blocks have different lock settings.', {
				exact: false,
			} )
		).toBeVisible();

		await lockRemoval.click();
		await modal
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.click();

		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ attributes: { lock: { move: true, remove: true } } },
				{ attributes: { lock: { move: false, remove: true } } },
			] );
	} );

	test( 'applies the lock to inner blocks only for blocks that hold them', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Outside' },
		} );
		await editor.insertBlock( {
			name: 'core/group',
			attributes: { layout: { type: 'constrained' } },
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Inside' },
				},
			],
		} );
		await editor.selectBlocks(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.first(),
			editor.canvas.getByRole( 'document', { name: 'Block: Group' } )
		);

		await editor.clickBlockOptionsMenuItem( 'Lock' );

		const modal = page.getByRole( 'dialog', { name: 'Lock blocks' } );
		await modal
			.getByRole( 'checkbox', { name: 'Lock all', exact: true } )
			.click();
		await modal
			.getByRole( 'checkbox', {
				name: 'Apply to all blocks inside',
				exact: true,
			} )
			.click();
		await modal
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { lock: { move: true, remove: true } },
			},
			{
				name: 'core/group',
				attributes: {
					lock: { move: true, remove: true },
					templateLock: 'all',
				},
			},
		] );
		const [ paragraph ] = await editor.getBlocks();
		expect( paragraph.attributes.templateLock ).toBeUndefined();
	} );

	test( 'block locking supersedes template locking', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				layout: { type: 'constrained' },
				templateLock: 'all',
			},
			innerBlocks: [
				{
					name: 'core/heading',
					attributes: { content: 'Hello, hello' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'WordPress' },
				},
			],
		} );

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await paragraph.click();

		await editor.clickBlockToolbarButton( 'Unlock' );
		await page
			.getByRole( 'checkbox', { name: 'Lock all', exact: true } )
			.click();
		await page
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.click();

		await expect(
			page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Move up' } )
		).toBeVisible();

		await paragraph.click();
		await pageUtils.pressKeys( 'access+z' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				attributes: {
					layout: { type: 'constrained' },
					templateLock: 'all',
				},
				innerBlocks: [
					{
						name: 'core/heading',
						attributes: { content: 'Hello, hello' },
					},
				],
			},
		] );
	} );
} );
