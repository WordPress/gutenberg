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
	publishPost,
} from '@wordpress/e2e-test-utils';

const getSelection = async () => {
	return await page.evaluate( () => {
		const selectedBlock = document.activeElement.closest( '.wp-block' );
		const blocks = Array.from( document.querySelectorAll( '.wp-block' ) );
		const blockIndex = blocks.indexOf( selectedBlock );

		if ( blockIndex === -1 ) {
			return {};
		}

		let editables;

		if ( selectedBlock.getAttribute( 'contenteditable' ) ) {
			editables = [ selectedBlock ];
		} else {
			editables = Array.from(
				selectedBlock.querySelectorAll( '[contenteditable]' )
			);
		}

		const editableIndex = editables.indexOf( document.activeElement );
		const selection = window.getSelection();

		if ( editableIndex === -1 || ! selection.rangeCount ) {
			return { blockIndex };
		}

		const range = selection.getRangeAt( 0 );
		const cloneStart = range.cloneRange();
		const cloneEnd = range.cloneRange();

		cloneStart.setStart( document.activeElement, 0 );
		cloneEnd.setStart( document.activeElement, 0 );

		/**
		 * Zero width non-breaking space, used as padding in the editable DOM
		 * tree when it is empty otherwise.
		 */
		const ZWNBSP = '\ufeff';

		return {
			blockIndex,
			editableIndex,
			startOffset: cloneStart.toString().replace( ZWNBSP, '' ).length,
			endOffset: cloneEnd.toString().replace( ZWNBSP, '' ).length,
		};
	} );
};

describe( 'undo', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should undo typing after a pause', async () => {
		await clickBlockAppender();

		await page.keyboard.type( 'before pause' );
		await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
		await page.keyboard.type( ' after pause' );

		const after = await getEditedPostContent();

		expect( after ).toMatchSnapshot();

		await pressKeyWithModifier( 'primary', 'z' );

		const before = await getEditedPostContent();

		expect( before ).toMatchSnapshot();
		expect( await getSelection() ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 'before pause'.length,
			endOffset: 'before pause'.length,
		} );

		await pressKeyWithModifier( 'primary', 'z' );

		expect( await getEditedPostContent() ).toBe( '' );
		expect( await getSelection() ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 0,
			endOffset: 0,
		} );

		await pressKeyWithModifier( 'primaryShift', 'z' );

		expect( await getEditedPostContent() ).toBe( before );
		expect( await getSelection() ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 'before pause'.length,
			endOffset: 'before pause'.length,
		} );

		await pressKeyWithModifier( 'primaryShift', 'z' );

		expect( await getEditedPostContent() ).toBe( after );
		expect( await getSelection() ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 'before pause after pause'.length,
			endOffset: 'before pause after pause'.length,
		} );
	} );

	it( 'should undo typing after non input change', async () => {
		await clickBlockAppender();

		await page.keyboard.type( 'before keyboard ' );
		await pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( 'after keyboard' );

		const after = await getEditedPostContent();

		expect( after ).toMatchSnapshot();

		await pressKeyWithModifier( 'primary', 'z' );

		const before = await getEditedPostContent();

		expect( before ).toMatchSnapshot();
		expect( await getSelection() ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 'before keyboard '.length,
			endOffset: 'before keyboard '.length,
		} );

		await pressKeyWithModifier( 'primary', 'z' );

		expect( await getEditedPostContent() ).toBe( '' );
		expect( await getSelection() ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 0,
			endOffset: 0,
		} );

		await pressKeyWithModifier( 'primaryShift', 'z' );

		expect( await getEditedPostContent() ).toBe( before );
		expect( await getSelection() ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 'before keyboard '.length,
			endOffset: 'before keyboard '.length,
		} );

		await pressKeyWithModifier( 'primaryShift', 'z' );

		expect( await getEditedPostContent() ).toBe( after );
		expect( await getSelection() ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 'before keyboard after keyboard'.length,
			endOffset: 'before keyboard after keyboard'.length,
		} );
	} );

	it( 'should undo bold', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'test' );
		await saveDraft();
		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );
		await page.click( '[data-type="core/paragraph"]' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'b' );
		await pressKeyWithModifier( 'primary', 'z' );

		const visibleResult = await page.evaluate(
			() => document.activeElement.innerHTML
		);
		expect( visibleResult ).toBe( 'test' );
	} );

	it( 'Should undo/redo to expected level intervals', async () => {
		await clickBlockAppender();

		const firstBlock = await getEditedPostContent();

		await page.keyboard.type( 'This' );

		const firstText = await getEditedPostContent();

		await page.keyboard.press( 'Enter' );

		const secondBlock = await getEditedPostContent();

		await page.keyboard.type( 'is' );

		const secondText = await getEditedPostContent();

		await page.keyboard.press( 'Enter' );

		const thirdBlock = await getEditedPostContent();

		await page.keyboard.type( 'test' );

		const thirdText = await getEditedPostContent();

		await pressKeyWithModifier( 'primary', 'z' ); // Undo 3rd paragraph text.

		expect( await getEditedPostContent() ).toBe( thirdBlock );
		expect( await getSelection() ).toEqual( {
			blockIndex: 3,
			editableIndex: 0,
			startOffset: 0,
			endOffset: 0,
		} );

		await pressKeyWithModifier( 'primary', 'z' ); // Undo 3rd block.

		expect( await getEditedPostContent() ).toBe( secondText );
		expect( await getSelection() ).toEqual( {
			blockIndex: 2,
			editableIndex: 0,
			startOffset: 'is'.length,
			endOffset: 'is'.length,
		} );

		await pressKeyWithModifier( 'primary', 'z' ); // Undo 2nd paragraph text.

		expect( await getEditedPostContent() ).toBe( secondBlock );
		expect( await getSelection() ).toEqual( {
			blockIndex: 2,
			editableIndex: 0,
			startOffset: 0,
			endOffset: 0,
		} );

		await pressKeyWithModifier( 'primary', 'z' ); // Undo 2nd block.

		expect( await getEditedPostContent() ).toBe( firstText );
		expect( await getSelection() ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 'This'.length,
			endOffset: 'This'.length,
		} );

		await pressKeyWithModifier( 'primary', 'z' ); // Undo 1st paragraph text.

		expect( await getEditedPostContent() ).toBe( firstBlock );
		expect( await getSelection() ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 0,
			endOffset: 0,
		} );

		await pressKeyWithModifier( 'primary', 'z' ); // Undo 1st block.

		expect( await getEditedPostContent() ).toBe( '' );
		expect( await getSelection() ).toEqual( {} );
		// After undoing every action, there should be no more undo history.
		expect(
			await page.$( '.editor-history__undo[aria-disabled="true"]' )
		).not.toBeNull();

		await pressKeyWithModifier( 'primaryShift', 'z' ); // Redo 1st block.

		expect( await getEditedPostContent() ).toBe( firstBlock );
		expect( await getSelection() ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 0,
			endOffset: 0,
		} );
		// After redoing one change, the undo button should be enabled again.
		expect(
			await page.$( '.editor-history__undo[aria-disabled="true"]' )
		).toBeNull();

		await pressKeyWithModifier( 'primaryShift', 'z' ); // Redo 1st paragraph text.

		expect( await getEditedPostContent() ).toBe( firstText );
		expect( await getSelection() ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 'This'.length,
			endOffset: 'This'.length,
		} );

		await pressKeyWithModifier( 'primaryShift', 'z' ); // Redo 2nd block.

		expect( await getEditedPostContent() ).toBe( secondBlock );
		expect( await getSelection() ).toEqual( {
			blockIndex: 2,
			editableIndex: 0,
			startOffset: 0,
			endOffset: 0,
		} );

		await pressKeyWithModifier( 'primaryShift', 'z' ); // Redo 2nd paragraph text.

		expect( await getEditedPostContent() ).toBe( secondText );
		expect( await getSelection() ).toEqual( {
			blockIndex: 2,
			editableIndex: 0,
			startOffset: 'is'.length,
			endOffset: 'is'.length,
		} );

		await pressKeyWithModifier( 'primaryShift', 'z' ); // Redo 3rd block.

		expect( await getEditedPostContent() ).toBe( thirdBlock );
		expect( await getSelection() ).toEqual( {
			blockIndex: 3,
			editableIndex: 0,
			startOffset: 0,
			endOffset: 0,
		} );

		await pressKeyWithModifier( 'primaryShift', 'z' ); // Redo 3rd paragraph text.

		expect( await getEditedPostContent() ).toBe( thirdText );
		expect( await getSelection() ).toEqual( {
			blockIndex: 3,
			editableIndex: 0,
			startOffset: 'test'.length,
			endOffset: 'test'.length,
		} );
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
		await page.waitForSelector( '.edit-post-layout' );

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
		const visibleContent = await page.evaluate(
			() => document.activeElement.textContent
		);
		expect( visibleContent ).toBe( 'original' );
	} );

	it( 'should not create undo levels when saving', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await saveDraft();
		await pressKeyWithModifier( 'primary', 'z' );

		expect( await getEditedPostContent() ).toBe( '' );
	} );

	it( 'should not create undo levels when publishing', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await publishPost();
		await pressKeyWithModifier( 'primary', 'z' );

		expect( await getEditedPostContent() ).toBe( '' );
	} );

	it( 'should immediately create an undo level on typing', async () => {
		await clickBlockAppender();

		await page.keyboard.type( '1' );
		await saveDraft();
		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );

		// Expect undo button to be disabled.
		expect(
			await page.$( '.editor-history__undo[aria-disabled="true"]' )
		).not.toBeNull();

		await page.click( '[data-type="core/paragraph"]' );

		await page.keyboard.type( '2' );

		// Expect undo button to be enabled.
		expect(
			await page.$( '.editor-history__undo[aria-disabled="true"]' )
		).toBeNull();

		await pressKeyWithModifier( 'primary', 'z' );

		// Expect "1".
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should be able to undo and redo when transient changes have been made and we update/publish', async () => {
		// Typing consecutive characters in a `Paragraph` block updates the same
		// block attribute as in the previous action and results in transient edits
		// and skipping `undo` history steps.
		const text = 'tonis';
		await clickBlockAppender();
		await page.keyboard.type( text );
		await publishPost();
		await pressKeyWithModifier( 'primary', 'z' );
		expect( await getEditedPostContent() ).toBe( '' );
		await page.waitForSelector(
			'.editor-history__redo[aria-disabled="false"]'
		);
		await page.click( '.editor-history__redo[aria-disabled="false"]' );
		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>tonis</p>
		<!-- /wp:paragraph -->"
	` );
	} );
} );
