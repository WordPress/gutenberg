/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	undoUtils: async ( { page }, use ) => {
		await use( new UndoUtils( { page } ) );
	},
} );

test.describe( 'undo', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should undo typing after a pause', async ( {
		editor,
		page,
		pageUtils,
		undoUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'before pause' );
		await editor.page.waitForTimeout( 1000 );
		await page.keyboard.type( ' after pause' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'before pause after pause' },
			},
		] );

		await pageUtils.pressKeys( 'primary+z' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'before pause' },
			},
		] );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 0,
			startOffset: 'before pause'.length,
			endOffset: 'before pause'.length,
		} );

		await pageUtils.pressKeys( 'primary+z' );

		await expect.poll( editor.getEditedPostContent ).toBe( '' );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 0,
		} );

		await pageUtils.pressKeys( 'primaryShift+z' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'before pause' },
			},
		] );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 0,
			startOffset: 'before pause'.length,
			endOffset: 'before pause'.length,
		} );

		await pageUtils.pressKeys( 'primaryShift+z' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'before pause after pause' },
			},
		] );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 0,
			startOffset: 'before pause after pause'.length,
			endOffset: 'before pause after pause'.length,
		} );
	} );

	test( 'should undo typing after non input change', async ( {
		editor,
		page,
		pageUtils,
		undoUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();

		await page.keyboard.type( 'before keyboard ' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( 'after keyboard' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'before keyboard <strong>after keyboard</strong>',
				},
			},
		] );

		await pageUtils.pressKeys( 'primary+z' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'before keyboard ',
				},
			},
		] );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 0,
			startOffset: 'before keyboard '.length,
			endOffset: 'before keyboard '.length,
		} );

		await pageUtils.pressKeys( 'primary+z' );

		await expect.poll( editor.getEditedPostContent ).toBe( '' );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 0,
		} );

		await pageUtils.pressKeys( 'primaryShift+z' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'before keyboard ',
				},
			},
		] );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 0,
			startOffset: 'before keyboard '.length,
			endOffset: 'before keyboard '.length,
		} );

		await pageUtils.pressKeys( 'primaryShift+z' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'before keyboard <strong>after keyboard</strong>',
				},
			},
		] );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 0,
			startOffset: 'before keyboard after keyboard'.length,
			endOffset: 'before keyboard after keyboard'.length,
		} );
	} );

	test( 'should undo bold', async ( { page, pageUtils, editor } ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'test' );
		await editor.saveDraft();
		await page.reload();
		await editor.canvas.locator( '[data-type="core/paragraph"]' ).click();
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+b' );
		await pageUtils.pressKeys( 'primary+z' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'test',
				},
			},
		] );
	} );

	test( 'Should undo/redo to expected level intervals', async ( {
		editor,
		page,
		pageUtils,
		undoUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();

		const firstBlock = await editor.getEditedPostContent();

		await page.keyboard.type( 'This' );

		const firstText = await editor.getEditedPostContent();

		await page.keyboard.press( 'Enter' );

		const secondBlock = await editor.getEditedPostContent();

		await page.keyboard.type( 'is' );

		const secondText = await editor.getEditedPostContent();

		await page.keyboard.press( 'Enter' );

		const thirdBlock = await editor.getEditedPostContent();

		await page.keyboard.type( 'test' );

		const thirdText = await editor.getEditedPostContent();

		await pageUtils.pressKeys( 'primary+z' ); // Undo 3rd paragraph text.

		await expect.poll( editor.getEditedPostContent ).toBe( thirdBlock );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 2,
		} );

		await pageUtils.pressKeys( 'primary+z' ); // Undo 3rd block.

		await expect.poll( editor.getEditedPostContent ).toBe( secondText );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 1,
			startOffset: 'is'.length,
			endOffset: 'is'.length,
		} );

		await pageUtils.pressKeys( 'primary+z' ); // Undo 2nd paragraph text.

		await expect.poll( editor.getEditedPostContent ).toBe( secondBlock );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 1,
		} );

		await pageUtils.pressKeys( 'primary+z' ); // Undo 2nd block.

		await expect.poll( editor.getEditedPostContent ).toBe( firstText );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 0,
			startOffset: 'This'.length,
			endOffset: 'This'.length,
		} );

		await pageUtils.pressKeys( 'primary+z' ); // Undo 1st paragraph text.

		await expect.poll( editor.getEditedPostContent ).toBe( firstBlock );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 0,
		} );

		await pageUtils.pressKeys( 'primary+z' ); // Undo 1st block.

		await expect.poll( editor.getEditedPostContent ).toBe( '' );
		await expect.poll( undoUtils.getSelection ).toEqual( {} );
		// After undoing every action, there should be no more undo history.
		await expect(
			page.locator( 'role=button[name="Undo"]' )
		).toBeDisabled();

		await pageUtils.pressKeys( 'primaryShift+z' ); // Redo 1st block.

		await expect.poll( editor.getEditedPostContent ).toBe( firstBlock );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 0,
			startOffset: 0,
			endOffset: 0,
		} );
		// After redoing one change, the undo button should be enabled again.
		await expect(
			page.locator( 'role=button[name="Undo"]' )
		).toBeEnabled();

		await pageUtils.pressKeys( 'primaryShift+z' ); // Redo 1st paragraph text.

		await expect.poll( editor.getEditedPostContent ).toBe( firstText );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 0,
			startOffset: 'This'.length,
			endOffset: 'This'.length,
		} );

		await pageUtils.pressKeys( 'primaryShift+z' ); // Redo 2nd block.

		await expect.poll( editor.getEditedPostContent ).toBe( secondBlock );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 1,
			startOffset: 0,
			endOffset: 0,
		} );

		await pageUtils.pressKeys( 'primaryShift+z' ); // Redo 2nd paragraph text.

		await expect.poll( editor.getEditedPostContent ).toBe( secondText );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 1,
			startOffset: 'is'.length,
			endOffset: 'is'.length,
		} );

		await pageUtils.pressKeys( 'primaryShift+z' ); // Redo 3rd block.

		await expect.poll( editor.getEditedPostContent ).toBe( thirdBlock );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 2,
			startOffset: 0,
			endOffset: 0,
		} );

		await pageUtils.pressKeys( 'primaryShift+z' ); // Redo 3rd paragraph text.

		await expect.poll( editor.getEditedPostContent ).toBe( thirdText );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 2,
			startOffset: 'test'.length,
			endOffset: 'test'.length,
		} );
	} );

	test( 'should undo for explicit persistence editing post', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		// Regression test: An issue had occurred where the creation of an
		// explicit undo level would interfere with blocks values being synced
		// correctly to the block editor.
		//
		// See: https://github.com/WordPress/gutenberg/issues/14950

		// Issue is demonstrated from an edited post: create, save, and reload.
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'original' );
		await editor.saveDraft();
		await page.reload();

		// Issue is demonstrated by forcing state merges (multiple inputs) on
		// an existing text after a fresh reload.
		await editor.canvas
			.locator( '[data-type="core/paragraph"] >> nth=0' )
			.click();
		await page.keyboard.type( 'modified' );

		// The issue is demonstrated after the one second delay to trigger the
		// creation of an explicit undo persistence level.
		await editor.page.waitForTimeout( 1000 );

		await pageUtils.pressKeys( 'primary+z' );

		// Assert against the _visible_ content. Since editor state with the
		// regression present was accurate, it would produce the correct
		// content. The issue had manifested in the form of what was shown to
		// the user since the blocks state failed to sync to block editor.
		const activeElementLocator = editor.canvas.locator(
			'[data-type="core/paragraph"] >> nth=0'
		);
		await expect( activeElementLocator ).toHaveText( 'original' );
	} );

	test( 'should not create undo levels when saving', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '1' );
		await editor.saveDraft();
		await pageUtils.pressKeys( 'primary+z' );

		await expect.poll( editor.getEditedPostContent ).toBe( '' );
	} );

	test( 'should not create undo levels when publishing', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '1' );
		await editor.publishPost();
		await pageUtils.pressKeys( 'primary+z' );

		await expect.poll( editor.getEditedPostContent ).toBe( '' );
	} );

	test( 'should immediately create an undo level on typing', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();

		await page.keyboard.type( '1' );
		await editor.saveDraft();
		await page.reload();

		// Expect undo button to be disabled.
		await expect(
			page.locator( 'role=button[name="Undo"]' )
		).toBeDisabled();
		await editor.canvas.locator( '[data-type="core/paragraph"]' ).click();

		await page.keyboard.type( '2' );

		// Expect undo button to be enabled.
		await expect(
			page.locator( 'role=button[name="Undo"]' )
		).toBeEnabled();

		await pageUtils.pressKeys( 'primary+z' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: '1',
				},
			},
		] );
	} );

	test( 'should be able to undo and redo when transient changes have been made and we update/publish', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Typing consecutive characters in a `Paragraph` block updates the same
		// block attribute as in the previous action and results in transient edits
		// and skipping `undo` history steps.
		const text = 'tonis';
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( text );
		await editor.publishPost();
		await pageUtils.pressKeys( 'primary+z' );
		await expect.poll( editor.getEditedPostContent ).toBe( '' );
		await expect(
			page.locator( 'role=button[name="Redo"]' )
		).toBeEnabled();
		await page.click( 'role=button[name="Redo"]' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'tonis',
				},
			},
		] );
	} );

	// @see https://github.com/WordPress/gutenberg/issues/12075
	test( 'should be able to undo and redo property cross property changes', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.type( 'a' ); // First step.
		await page.keyboard.press( 'Backspace' ); // Second step.
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click(); // third step.

		// Title should be empty
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toHaveText( '' );

		// First undo removes the block.
		// Second undo restores the title.
		await pageUtils.pressKeys( 'primary+z' );
		await pageUtils.pressKeys( 'primary+z' );
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toHaveText( 'a' );

		// Redoing the "backspace" should clear the title again.
		await pageUtils.pressKeys( 'primaryShift+z' );
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toHaveText( '' );
	} );
} );

class UndoUtils {
	constructor( { page } ) {
		this.page = page;

		this.getSelection = this.getSelection.bind( this );
	}

	async getSelection() {
		return await this.page.evaluate( () => {
			const selectedBlockId = window.wp.data
				.select( 'core/block-editor' )
				.getSelectedBlockClientId();
			const blockIndex = window.wp.data
				.select( 'core/block-editor' )
				.getBlockIndex( selectedBlockId );

			if ( blockIndex === -1 ) {
				return {};
			}

			return {
				blockIndex,
				startOffset: window.wp.data
					.select( 'core/block-editor' )
					.getSelectionStart().offset,
				endOffset: window.wp.data
					.select( 'core/block-editor' )
					.getSelectionEnd().offset,
			};
		} );
	}
}
