/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
	pressKeyWithModifier,
	selectBlockByClientId,
	getAllBlocks,
	saveDraft,
} from '@wordpress/e2e-test-utils';

describe( 'undo', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should undo typing after a pause', async () => {
		await clickBlockAppender();

		await page.keyboard.type( 'before pause' );
		await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
		await page.keyboard.type( ' after pause' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primary', 'z' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should undo typing after non input change', async () => {
		await clickBlockAppender();

		await page.keyboard.type( 'before keyboard ' );
		await pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( 'after keyboard' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primary', 'z' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'Should undo to expected level intervals', async () => {
		await clickBlockAppender();

		await page.keyboard.type( 'This' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'is' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'test' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primary', 'z' ); // Undo 3rd paragraph text.
		await pressKeyWithModifier( 'primary', 'z' ); // Undo 3rd block.
		await pressKeyWithModifier( 'primary', 'z' ); // Undo 2nd paragraph text.
		await pressKeyWithModifier( 'primary', 'z' ); // Undo 2nd block.
		await pressKeyWithModifier( 'primary', 'z' ); // Undo 1st paragraph text.
		await pressKeyWithModifier( 'primary', 'z' ); // Undo 1st block.

		expect( await getEditedPostContent() ).toBe( '' );
		// After undoing every action, there should be no more undo history.
		expect( await page.$( '.editor-history__undo[aria-disabled="true"]' ) ).not.toBeNull();
	} );

	it( 'should undo for explicit persistence editing post', async () => {
		// Regression test: An issue had occurred where the creation of an
		// explicit undo level would interfere with blocks values being synced
		// correctly to the block editor.
		//
		// See: https://github.com/WordPress/gutenberg/issues/14950

		// Issue is demonstrated from an edited post: create, save, and reload.
		await clickBlockAppender();
		await page.keyboard.type( 'original' );
		await saveDraft();
		await page.reload();

		// Issue is demonstrated by forcing state merges (multiple inputs) on
		// an existing text after a fresh reload.
		await selectBlockByClientId( ( await getAllBlocks() )[ 0 ].clientId );
		await page.keyboard.type( 'modified' );

		// The issue is demonstrated after the one second delay to trigger the
		// creation of an explicit undo persistence level.
		await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );

		await pressKeyWithModifier( 'primary', 'z' );

		// Assert against the _visible_ content. Since editor state with the
		// regression present was accurate, it would produce the correct
		// content. The issue had manifested in the form of what was shown to
		// the user since the blocks state failed to sync to block editor.
		const visibleContent = await page.evaluate( () => document.activeElement.textContent );
		expect( visibleContent ).toBe( 'original' );
	} );
} );
