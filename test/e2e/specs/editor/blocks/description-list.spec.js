const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const STRUCTURE_WARNING_PANEL = 'Description List structure';
const INVALID_BOUNDARIES_WARNING =
	'Start this list with a term and end it with a description. Reorder blocks or change their types to complete the list.';
const INVALID_START_WARNING =
	'Start this list with a term. Reorder blocks or change their types.';
const INVALID_END_WARNING =
	'End this list with a description. Reorder blocks or change their types.';

async function expectStructureWarning( page, message ) {
	const panel = page.getByRole( 'button', {
		name: STRUCTURE_WARNING_PANEL,
	} );

	await expect( panel ).toHaveCount( 1 );
	await expect( panel ).toBeVisible();
	await expect( page.getByText( message, { exact: true } ) ).toBeVisible();
}

async function expectNoStructureWarning( page ) {
	await expect(
		page.getByRole( 'button', { name: STRUCTURE_WARNING_PANEL } )
	).toHaveCount( 0 );
}

async function selectParentListSettings( { editor, page, child } ) {
	await child.click();
	await editor.clickBlockToolbarButton(
		'Select parent block: Description List'
	);
	await page.getByRole( 'tab', { name: 'Settings', exact: true } ).click();
}

test.describe( 'Description List', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'should not warn for consecutive terms and descriptions with valid boundaries', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-term',
					attributes: { content: 'API' },
				},
				{
					name: 'core/description-term',
					attributes: { content: 'SDK' },
				},
				{
					name: 'core/description-detail',
					attributes: { content: 'First description' },
				},
				{
					name: 'core/description-detail',
					attributes: { content: 'Second description' },
				},
			],
		} );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Description Detail' } )
			.first()
			.click();

		await expectNoStructureWarning( page );
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'should show one warning in Settings when the parent list is selected', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-term',
					attributes: { content: 'API' },
				},
			],
		} );

		await selectParentListSettings( {
			editor,
			page,
			child: editor.canvas.getByRole( 'document', {
				name: 'Block: Description Term',
			} ),
		} );

		await expectStructureWarning( page, INVALID_END_WARNING );
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'should show the warning only for the selected invalid list', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-term',
					attributes: { content: 'Incomplete term' },
				},
			],
		} );
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-term',
					attributes: { content: 'Complete term' },
				},
				{
					name: 'core/description-detail',
					attributes: { content: 'Complete description' },
				},
			],
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Outside the lists' },
		} );

		const invalidTerm = editor.canvas
			.getByRole( 'document', { name: 'Block: Description Term' } )
			.filter( { hasText: 'Incomplete term' } );
		await invalidTerm.click();
		await expectStructureWarning( page, INVALID_END_WARNING );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Description Detail' } )
			.filter( { hasText: 'Complete description' } )
			.click();
		await expectNoStructureWarning( page );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await expectNoStructureWarning( page );

		await invalidTerm.click();
		await expectStructureWarning( page, INVALID_END_WARNING );
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'should restore the current warning after reopening Settings', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-detail',
					attributes: { content: 'Orphan description' },
				},
			],
		} );

		await selectParentListSettings( {
			editor,
			page,
			child: editor.canvas.getByRole( 'document', {
				name: 'Block: Description Detail',
			} ),
		} );
		await expectStructureWarning( page, INVALID_START_WARNING );

		await page.getByRole( 'button', { name: 'Close Settings' } ).click();
		await expectNoStructureWarning( page );

		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'tab', { name: 'Settings', exact: true } )
			.click();
		await expectStructureWarning( page, INVALID_START_WARNING );
	} );

	test( 'should update the warning while each invalid boundary is repaired', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-detail',
					attributes: { content: 'First description' },
				},
				{
					name: 'core/description-term',
					attributes: { content: 'First term' },
				},
				{
					name: 'core/description-term',
					attributes: { content: 'Trailing term' },
				},
			],
		} );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Description Detail' } )
			.click();

		await expectStructureWarning( page, INVALID_BOUNDARIES_WARNING );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Description Term' } )
			.filter( { hasText: 'First term' } )
			.click();
		await editor.clickBlockToolbarButton( 'Move up' );
		await expectStructureWarning( page, INVALID_END_WARNING );

		const firstDescription = editor.canvas
			.getByRole( 'document', { name: 'Block: Description Detail' } )
			.filter( { hasText: 'First description' } );
		await firstDescription.click();
		await editor.clickBlockToolbarButton( 'Move down' );
		await expectNoStructureWarning( page );

		await firstDescription.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' updated' );
		await expect( firstDescription ).toContainText(
			'First description updated'
		);
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'should update the warning after deletion, Undo, and Redo', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/description-list' } );
		await page.keyboard.type( 'API' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Application programming interface' );
		await editor.clickBlockToolbarButton( 'Options' );
		await page.getByRole( 'menuitem', { name: 'Delete' } ).click();

		await expectStructureWarning( page, INVALID_END_WARNING );

		await pageUtils.pressKeys( 'primary+z' );
		await expectNoStructureWarning( page );

		await pageUtils.pressKeys( 'primary+shift+z' );
		await expectStructureWarning( page, INVALID_END_WARNING );
	} );

	test( 'should focus the term on insert and move to the detail on Enter', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/description-list' } );
		await page.keyboard.type( 'API' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Application programming interface' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:description-list -->
<dl class="wp-block-description-list"><!-- wp:description-term -->
<dt>API</dt>
<!-- /wp:description-term -->

<!-- wp:description-detail -->
<dd>Application programming interface</dd>
<!-- /wp:description-detail --></dl>
<!-- /wp:description-list -->`
		);
	} );

	test( 'should append a term and detail on Enter at the end of the last detail', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/description-list' } );
		await page.keyboard.type( 'API' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Application programming interface' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'SDK' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/description-list',
				innerBlocks: [
					{
						name: 'core/description-term',
						attributes: { content: 'API' },
					},
					{
						name: 'core/description-detail',
						attributes: {
							content: 'Application programming interface',
						},
					},
					{
						name: 'core/description-term',
						attributes: { content: 'SDK' },
					},
					{
						name: 'core/description-detail',
						attributes: { content: '' },
					},
				],
			},
		] );
	} );

	test( 'should undo appending a term and detail in one step', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/description-list' } );
		await page.keyboard.type( 'API' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Application programming interface' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeys( 'primary+z' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/description-list',
				innerBlocks: [
					{
						name: 'core/description-term',
						attributes: { content: 'API' },
					},
					{
						name: 'core/description-detail',
						attributes: {
							content: 'Application programming interface',
						},
					},
				],
			},
		] );
	} );

	test( 'should append a detail on Enter at the end of a trailing term', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-term',
					attributes: { content: 'Cyclone' },
				},
			],
		} );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Description Term' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Rotating weather system' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/description-list',
				innerBlocks: [
					{
						name: 'core/description-term',
						attributes: { content: 'Cyclone' },
					},
					{
						name: 'core/description-detail',
						attributes: { content: 'Rotating weather system' },
					},
				],
			},
		] );
	} );

	test( 'should move to the next item on Enter at the end of an item followed by another', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-term',
					attributes: { content: 'API' },
				},
				{
					name: 'core/description-detail',
					attributes: {
						content: 'Application programming interface',
					},
				},
				{
					name: 'core/description-term',
					attributes: { content: 'SDK' },
				},
				{
					name: 'core/description-detail',
					attributes: { content: 'Software development kit' },
				},
			],
		} );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Description Detail' } )
			.filter( { hasText: 'Application programming interface' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Web ' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/description-list',
				innerBlocks: [
					{
						name: 'core/description-term',
						attributes: { content: 'API' },
					},
					{
						name: 'core/description-detail',
						attributes: {
							content: 'Application programming interface',
						},
					},
					{
						name: 'core/description-term',
						attributes: { content: 'Web SDK' },
					},
					{
						name: 'core/description-detail',
						attributes: { content: 'Software development kit' },
					},
				],
			},
		] );
	} );

	test( 'should split a term on Enter in the middle', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/description-list' } );
		await page.keyboard.type( 'Cyclone' );
		await pageUtils.pressKeys( 'ArrowLeft', { times: 'clone'.length } );
		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/description-list',
				innerBlocks: [
					{
						name: 'core/description-term',
						attributes: { content: 'Cy' },
					},
					{
						name: 'core/description-term',
						attributes: { content: 'clone' },
					},
					{
						name: 'core/description-detail',
						attributes: { content: '' },
					},
				],
			},
		] );
	} );

	test( 'should split a detail on Enter in the middle', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/description-list' } );
		await page.keyboard.type( 'API' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'FirstSecond' );
		await pageUtils.pressKeys( 'ArrowLeft', { times: 'Second'.length } );
		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/description-list',
				innerBlocks: [
					{
						name: 'core/description-term',
						attributes: { content: 'API' },
					},
					{
						name: 'core/description-detail',
						attributes: { content: 'First' },
					},
					{
						name: 'core/description-detail',
						attributes: { content: 'Second' },
					},
				],
			},
		] );
	} );

	test( 'should transform a term to a detail and back', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/description-list' } );
		await page.keyboard.type( 'API' );

		await editor.clickBlockToolbarButton( 'Description Term' );
		await page
			.getByRole( 'menuitem', { name: 'Description Detail' } )
			.click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/description-list',
				innerBlocks: [
					{
						name: 'core/description-detail',
						attributes: { content: 'API' },
					},
					{
						name: 'core/description-detail',
						attributes: { content: '' },
					},
				],
			},
		] );
		await expectStructureWarning( page, INVALID_START_WARNING );

		await editor.clickBlockToolbarButton( 'Description Detail' );
		await page
			.getByRole( 'menuitem', { name: 'Description Term' } )
			.click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/description-list',
				innerBlocks: [
					{
						name: 'core/description-term',
						attributes: { content: 'API' },
					},
					{
						name: 'core/description-detail',
						attributes: { content: '' },
					},
				],
			},
		] );
		await expectNoStructureWarning( page );
	} );

	test( 'should continue typing while displaying a structure warning', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-detail',
					attributes: { content: 'API' },
				},
				{
					name: 'core/description-detail',
					attributes: { content: '' },
				},
			],
		} );
		const firstDetail = editor.canvas
			.getByRole( 'document', { name: 'Block: Description Detail' } )
			.first();
		await firstDetail.click();
		await expectStructureWarning( page, INVALID_START_WARNING );
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' reference' );

		await expect( firstDetail ).toContainText( 'API reference' );
		await expectStructureWarning( page, INVALID_START_WARNING );
	} );

	test( 'should merge a term into the previous term on Backspace at the start', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-term',
					attributes: { content: 'Cy' },
				},
				{
					name: 'core/description-term',
					attributes: { content: 'clone' },
				},
				{
					name: 'core/description-detail',
					attributes: { content: 'Rotating weather system' },
				},
			],
		} );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Description Term' } )
			.filter( { hasText: 'clone' } )
			.click();
		await page.keyboard.press( 'Home' );
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/description-list',
				innerBlocks: [
					{
						name: 'core/description-term',
						attributes: { content: 'Cyclone' },
					},
					{
						name: 'core/description-detail',
						attributes: { content: 'Rotating weather system' },
					},
				],
			},
		] );
	} );

	test( 'should remove an empty item on Backspace', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-term',
					attributes: { content: 'API' },
				},
				{
					name: 'core/description-detail',
					attributes: {
						content: 'Application programming interface',
					},
				},
				{
					name: 'core/description-detail',
				},
			],
		} );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Description Detail' } )
			.last()
			.click();
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/description-list',
				innerBlocks: [
					{
						name: 'core/description-term',
						attributes: { content: 'API' },
					},
					{
						name: 'core/description-detail',
						attributes: {
							content: 'Application programming interface',
						},
					},
				],
			},
		] );
	} );

	test( 'should merge a detail into the previous term on Backspace at the start', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-term',
					attributes: { content: 'one' },
				},
				{
					name: 'core/description-detail',
					attributes: { content: 'two' },
				},
			],
		} );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Description Detail' } )
			.click();
		await page.keyboard.press( 'Home' );
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/description-list',
				innerBlocks: [
					{
						name: 'core/description-term',
						attributes: { content: 'onetwo' },
					},
				],
			},
		] );
	} );

	test( 'should paste a copied term outside the list wrapped in a list', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-term',
					attributes: { content: 'API' },
				},
				{
					name: 'core/description-detail',
					attributes: {
						content: 'Application programming interface',
					},
				},
			],
		} );
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Description Term',
			} )
		);
		await pageUtils.pressKeys( 'primary+c' );
		await editor.insertBlock( { name: 'core/paragraph' } );
		await pageUtils.pressKeys( 'primary+v' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/description-list' },
			{
				name: 'core/description-list',
				innerBlocks: [
					{
						name: 'core/description-term',
						attributes: { content: 'API' },
					},
				],
			},
		] );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Description Term' } )
			.last()
			.click();
		await expectStructureWarning( page, INVALID_END_WARNING );
	} );

	test( 'should paste a copied description outside the list wrapped in a list', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-term',
					attributes: { content: 'API' },
				},
				{
					name: 'core/description-detail',
					attributes: {
						content: 'Application programming interface',
					},
				},
			],
		} );
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Description Detail',
			} )
		);
		await pageUtils.pressKeys( 'primary+c' );
		await editor.insertBlock( { name: 'core/paragraph' } );
		await pageUtils.pressKeys( 'primary+v' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/description-list' },
			{
				name: 'core/description-list',
				innerBlocks: [
					{
						name: 'core/description-detail',
						attributes: {
							content: 'Application programming interface',
						},
					},
				],
			},
		] );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Description Detail' } )
			.last()
			.click();
		await expectStructureWarning( page, INVALID_START_WARNING );
	} );

	test( 'should move into the first term on ArrowDown from the block above', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Before' },
		} );
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-term',
					attributes: { content: 'API' },
				},
				{
					name: 'core/description-detail',
					attributes: {
						content: 'Application programming interface',
					},
				},
			],
		} );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( 'S' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: 'Before' } },
			{
				name: 'core/description-list',
				innerBlocks: [
					{
						name: 'core/description-term',
						attributes: { content: 'APIS' },
					},
					{ name: 'core/description-detail' },
				],
			},
		] );
	} );

	// Enter in an empty trailing detail keeps appending pairs instead of leaving the list.
	test.fixme( 'should exit the list on Enter in an empty trailing detail', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/description-list' } );
		await page.keyboard.type( 'API' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Application programming interface' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'After' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/description-list',
				innerBlocks: [
					{
						name: 'core/description-term',
						attributes: { content: 'API' },
					},
					{
						name: 'core/description-detail',
						attributes: {
							content: 'Application programming interface',
						},
					},
				],
			},
			{
				name: 'core/paragraph',
				attributes: { content: 'After' },
			},
		] );
	} );
} );
