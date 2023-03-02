/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	undoUtils: async ( { page }, use ) => {
		await use( new UndoUtils( { page } ) );
	},
} );

class UndoUtils {
	constructor( { page } ) {
		this.page = page;

		this.getSelection = this.getSelection.bind( this );
	}

	async getSelection() {
		return await this.page.evaluate( () => {
			const selectedBlock = document.activeElement.closest( '.wp-block' );
			const blocks = Array.from(
				document.querySelectorAll( '.wp-block' )
			);
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
	}
}

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
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'before pause' );
		await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
		await page.keyboard.type( ' after pause' );

		const after = await editor.getEditedPostContent();

		expect( after ).toBe(
			`<!-- wp:paragraph -->
<p>before pause after pause</p>
<!-- /wp:paragraph -->`
		);

		await pageUtils.pressKeyWithModifier( 'primary', 'z' );

		const before = await editor.getEditedPostContent();
		expect( before ).toBe(
			`<!-- wp:paragraph -->
<p>before pause</p>
<!-- /wp:paragraph -->`
		);

		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 'before pause'.length,
			endOffset: 'before pause'.length,
		} );

		await pageUtils.pressKeyWithModifier( 'primary', 'z' );

		await expect.poll( editor.getEditedPostContent ).toBe( '' );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 0,
			endOffset: 0,
		} );

		await pageUtils.pressKeyWithModifier( 'primaryShift', 'z' );

		await expect.poll( editor.getEditedPostContent ).toBe( before );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 'before pause'.length,
			endOffset: 'before pause'.length,
		} );

		await pageUtils.pressKeyWithModifier( 'primaryShift', 'z' );

		await expect.poll( editor.getEditedPostContent ).toBe( after );
		await expect.poll( undoUtils.getSelection ).toEqual( {
			blockIndex: 1,
			editableIndex: 0,
			startOffset: 'before pause after pause'.length,
			endOffset: 'before pause after pause'.length,
		} );
	} );
} );
