/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function addTestParagraphBlocks( { editor, page } ) {
	await test.step( 'add test paragraph blocks', async () => {
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '1st' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2nd' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3rd' );
	} );
}

test.describe( 'Block editor keyboard shortcuts', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.describe( 'move blocks - single block selected', () => {
		test( 'should move the block up', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await addTestParagraphBlocks( { editor, page } );
			await pageUtils.pressKeys( 'secondary+t', { times: 2 } );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: '3rd' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: '1st' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: '2nd' },
				},
			] );
		} );

		test( 'should move the block down', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await addTestParagraphBlocks( { editor, page } );
			await page.keyboard.press( 'ArrowUp' );
			await pageUtils.pressKeys( 'secondary+y' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: '1st' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: '3rd' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: '2nd' },
				},
			] );
		} );
	} );

	test.describe( 'move blocks - multiple blocks selected', () => {
		test( 'should move the blocks up', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await addTestParagraphBlocks( { editor, page } );
			await pageUtils.pressKeys( 'shift+ArrowUp' );
			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block tools' } )
					.getByRole( 'button', { name: 'Multiple blocks selected' } )
			).toBeVisible();
			await pageUtils.pressKeys( 'secondary+t' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: '2nd' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: '3rd' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: '1st' },
				},
			] );
		} );

		test( 'should move the blocks down', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await addTestParagraphBlocks( { editor, page } );
			await page.keyboard.press( 'ArrowUp' );
			await pageUtils.pressKeys( 'shift+ArrowUp' );
			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block tools' } )
					.getByRole( 'button', { name: 'Multiple blocks selected' } )
			).toBeVisible();
			await pageUtils.pressKeys( 'secondary+y' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: '3rd' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: '1st' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: '2nd' },
				},
			] );
		} );
	} );

	test.describe( 'test shortcuts handling through portals in the same tree', () => {
		test( 'should propagate properly and duplicate selected blocks', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await addTestParagraphBlocks( { editor, page } );
			// Multiselect via keyboard.
			await pageUtils.pressKeys( 'primary+a', { times: 2 } );

			await editor.clickBlockToolbarButton( 'Options' );
			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Duplicate' } )
			).toBeVisible();

			// Duplicate via keyboard.
			await pageUtils.pressKeys( 'primaryShift+d' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
				},
				{
					name: 'core/paragraph',
				},
				{
					name: 'core/paragraph',
				},
				{
					name: 'core/paragraph',
				},
				{
					name: 'core/paragraph',
				},
				{
					name: 'core/paragraph',
				},
			] );
		} );

		test( 'should prevent deleting multiple selected blocks from inputs', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await addTestParagraphBlocks( { editor, page } );
			// Multiselect via keyboard.
			await pageUtils.pressKeys( 'primary+a', { times: 2 } );

			await editor.clickBlockToolbarButton( 'Options' );
			await page
				.getByRole( 'menu', { name: 'Options' } )
				.getByRole( 'menuitem', { name: 'Create pattern' } )
				.click();
			await page
				.getByRole( 'dialog', { name: 'Create pattern' } )
				.getByRole( 'textbox', { name: 'Name' } )
				.fill( 'hi' );

			await page.keyboard.press( 'Backspace' );
			await page.keyboard.press( 'ArrowLeft' );
			await page.keyboard.press( 'Delete' );
			await page.keyboard.press( 'Escape' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: '1st' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: '2nd' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: '3rd' },
				},
			] );
		} );
	} );

	test.describe( 'create a group block from the selected blocks', () => {
		test( 'should propagate properly if multiple blocks are selected.', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await addTestParagraphBlocks( { editor, page } );

			// Multiselect via keyboard.
			await pageUtils.pressKeys( 'primary+a', { times: 2 } );

			await pageUtils.pressKeys( 'primary+g' ); // Keyboard shortcut for Insert before.
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/group',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '1st' },
						},
						{
							name: 'core/paragraph',
							attributes: { content: '2nd' },
						},
						{
							name: 'core/paragraph',
							attributes: { content: '3rd' },
						},
					],
				},
			] );
		} );

		test( 'should prevent if a single block is selected.', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await addTestParagraphBlocks( { editor, page } );
			const firstParagraphBlock = editor.canvas
				.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
				.first();
			await editor.selectBlocks( firstParagraphBlock );
			await pageUtils.pressKeys( 'primary+g' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: '1st' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: '2nd' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: '3rd' },
				},
			] );
		} );
	} );
} );
