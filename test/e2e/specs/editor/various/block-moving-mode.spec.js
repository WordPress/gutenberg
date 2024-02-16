/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block moving mode', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'can move block', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First Paragraph' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second Paragraph' },
		} );

		// Move the second block in front of the first block.
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Move to' } ).click();
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Second Paragraph' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: 'First Paragraph' },
			},
		] );
	} );

	test( 'can move block in the nested block', async ( { editor, page } ) => {
		// Create two group blocks with some blocks.
		await editor.insertBlock( { name: 'core/group' } );
		await editor.canvas
			.locator(
				'role=button[name="Group: Gather blocks in a container."i]'
			)
			.click();
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Enter' );
		await page.getByRole( 'option', { name: 'Paragraph' } ).click();
		await page.keyboard.type( 'First Paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second Paragraph' );

		await editor.insertBlock( { name: 'core/group' } );
		await editor.canvas
			.locator(
				'role=button[name="Group: Gather blocks in a container."i]'
			)
			.click();
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Enter' );
		await page.getByRole( 'option', { name: 'Paragraph' } ).click();
		await page.keyboard.type( 'Third Paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Fourth Paragraph' );

		// Move a paragraph block in the first group block into the second group block.
		const paragraphBlock = editor.canvas.locator(
			'text="First Paragraph"'
		);
		await paragraphBlock.focus();
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Move to' } ).click();
		await page.keyboard.press( 'ArrowLeft' ); // Select the first group block.
		await page.keyboard.press( 'ArrowDown' ); // Select the second group block.
		await page.keyboard.press( 'ArrowRight' ); // Enter the second group block.
		await page.keyboard.press( 'ArrowDown' ); // Move down in the second group block.
		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'Second Paragraph' },
					},
				],
			},
			{
				name: 'core/group',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'Third Paragraph' },
					},
					{
						name: 'core/paragraph',
						attributes: { content: 'First Paragraph' },
					},
					{
						name: 'core/paragraph',
						attributes: { content: 'Fourth Paragraph' },
					},
				],
			},
		] );
	} );

	test( 'can not move inside its own block', async ( { editor, page } ) => {
		// Create a paragraph block and a group block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First Paragraph' },
		} );
		await editor.insertBlock( { name: 'core/group' } );
		await editor.canvas
			.locator(
				'role=button[name="Group: Gather blocks in a container."i]'
			)
			.click();
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Enter' );
		await page.getByRole( 'option', { name: 'Paragraph' } ).click();
		await page.keyboard.type( 'Second Paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Third Paragraph' );

		// Trying to move the group block into its own.
		const groupBlock = editor.canvas.locator(
			'role=document[name="Block: Group"i]'
		);
		await groupBlock.focus();
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Move to' } ).click();
		await page.keyboard.press( 'ArrowRight' );
		await expect( groupBlock ).toHaveClass( /is-selected/ );
	} );
} );
