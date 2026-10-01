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

	test( 'can unlock from list view', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
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

		await pageUtils.pressKeys( 'access+o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const paragraphRow = listView.getByRole( 'gridcell', {
			name: 'Paragraph',
			exact: true,
			selected: true,
		} );

		await paragraphRow.getByRole( 'button', { name: 'Unlock' } ).click();

		await expect(
			paragraphRow.getByRole( 'button', { name: 'Lock settings' } )
		).toBeFocused();

		expect( await editor.getEditedPostContent() )
			.toBe( `<!-- wp:paragraph {"lock":{"move":false,"remove":false}} -->
<p>Some paragraph</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'can lock and unlock a group layout', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Group content' },
				},
			],
		} );

		await editor.clickBlockOptionsMenuItem( 'Lock' );
		const layoutCheckbox = page.getByRole( 'checkbox', {
			name: 'Lock layout',
			exact: true,
		} );
		await layoutCheckbox.check();
		await page
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.click();
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ attributes: { templateLock: 'contentOnly' } },
			] );

		await editor.clickBlockToolbarButton( 'Unlock' );
		await expect( layoutCheckbox ).toBeChecked();
		await layoutCheckbox.uncheck();
		await page
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.click();
		await expect
			.poll(
				async () =>
					( await editor.getBlocks() )[ 0 ].attributes.templateLock
			)
			.toBeUndefined();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'Group content' },
					},
				],
			},
		] );
	} );

	test( 'can unlock an unsynced pattern layout while editing the pattern', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				metadata: { patternName: 'theme/example', name: 'My pattern' },
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Pattern content' },
				},
			],
		} );

		await pageUtils.pressKeys( 'access+o' );
		const patternRow = page
			.getByRole( 'treegrid', { name: 'Block navigation structure' } )
			.getByRole( 'row', { name: 'My pattern Options', exact: true } );
		await patternRow
			.getByRole( 'link', { name: 'My pattern', exact: true } )
			.click();
		await editor.clickBlockToolbarButton( 'Edit pattern' );
		await patternRow
			.getByRole( 'button', { name: 'Options', exact: true } )
			.click();
		await page
			.getByRole( 'menuitem', { name: 'Unlock', exact: true } )
			.click();

		const layoutCheckbox = page.getByRole( 'checkbox', {
			name: 'Lock layout',
			exact: true,
		} );
		await expect( layoutCheckbox ).toBeChecked();
		await layoutCheckbox.uncheck();
		await page
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.click();

		await expect
			.poll(
				async () =>
					( await editor.getBlocks() )[ 0 ].attributes.metadata
			)
			.toEqual( { name: 'My pattern' } );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'Pattern content' },
					},
				],
			},
		] );
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

		await pageUtils.pressKeys( 'access+o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		await listView
			.getByRole( 'gridcell', {
				name: 'Paragraph',
				exact: true,
				selected: true,
			} )
			.getByRole( 'button', { name: 'Unlock' } )
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
