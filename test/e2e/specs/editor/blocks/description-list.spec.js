const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const term = ( content ) => ( {
	name: 'core/description-term',
	attributes:
		content === undefined
			? expect.any( Object )
			: expect.objectContaining( { content } ),
} );

const detail = ( content ) => ( {
	name: 'core/description-detail',
	attributes:
		content === undefined
			? expect.any( Object )
			: expect.objectContaining( { content } ),
} );

async function expectDescriptionListChildren( editor, children ) {
	await expect.poll( editor.getBlocks ).toMatchObject( [
		{
			name: 'core/description-list',
			innerBlocks: children,
		},
	] );
}

async function clickBlockSwitcherMenuItem( { editor, page, from, to } ) {
	await editor.showBlockToolbar();
	await page
		.getByRole( 'toolbar', { name: 'Block tools' } )
		.getByRole( 'button', { name: from } )
		.click();
	await page
		.getByRole( 'menu', { name: from } )
		.getByRole( 'menuitem', { name: to } )
		.click();
}

test.describe( 'Description List', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'inserts one term followed by one detail', async ( { editor } ) => {
		await editor.insertBlock( { name: 'core/description-list' } );

		await expectDescriptionListChildren( editor, [ term(), detail() ] );
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'transforms a term to a detail with Tab', async ( {
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
				{
					name: 'core/description-detail',
					attributes: { content: 'Rotating weather system' },
				},
			],
		} );

		await editor.canvas.getByText( 'Cyclone' ).click();
		await page.keyboard.press( 'Tab' );

		await expectDescriptionListChildren( editor, [
			detail( 'Cyclone' ),
			detail( 'Rotating weather system' ),
		] );
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'transforms a detail to a term with Shift+Tab', async ( {
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
				{
					name: 'core/description-detail',
					attributes: { content: 'Rotating weather system' },
				},
			],
		} );

		await editor.canvas.getByText( 'Rotating weather system' ).click();
		await page.keyboard.press( 'Shift+Tab' );

		await expectDescriptionListChildren( editor, [
			term( 'Cyclone' ),
			term( 'Rotating weather system' ),
		] );
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'toolbar transforms preserve child content', async ( {
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
			],
		} );

		await editor.canvas.getByText( 'API' ).click();
		await clickBlockSwitcherMenuItem( {
			editor,
			page,
			from: 'Description Term',
			to: 'Description Detail',
		} );
		await expectDescriptionListChildren( editor, [
			detail( 'API' ),
			detail( 'Application programming interface' ),
		] );

		await editor.canvas
			.getByText( 'Application programming interface' )
			.click();
		await clickBlockSwitcherMenuItem( {
			editor,
			page,
			from: 'Description Detail',
			to: 'Description Term',
		} );
		await expectDescriptionListChildren( editor, [
			detail( 'API' ),
			term( 'Application programming interface' ),
		] );
	} );

	test( 'Escape moves focus to the editor canvas after editing a child', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-term',
					attributes: { content: 'Nimbus' },
				},
				{
					name: 'core/description-detail',
					attributes: { content: 'Rain-bearing cloud' },
				},
			],
		} );

		await editor.canvas.getByText( 'Nimbus' ).click();
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Escape' );

		await expect(
			page.getByRole( 'button', { name: 'Editor canvas' } )
		).toBeFocused();
	} );

	// eslint-disable-next-line playwright/expect-expect
	test( 'retains child structure and content after save and reload', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/description-list',
			innerBlocks: [
				{
					name: 'core/description-term',
					attributes: { content: 'Monsoon' },
				},
				{
					name: 'core/description-detail',
					attributes: { content: 'Seasonal wind pattern' },
				},
				{
					name: 'core/description-term',
					attributes: { content: 'Sirocco' },
				},
				{
					name: 'core/description-detail',
					attributes: { content: 'Warm Mediterranean wind' },
				},
			],
		} );

		await editor.saveDraft();
		await page.reload();

		await expectDescriptionListChildren( editor, [
			term( 'Monsoon' ),
			detail( 'Seasonal wind pattern' ),
			term( 'Sirocco' ),
			detail( 'Warm Mediterranean wind' ),
		] );
	} );
} );
