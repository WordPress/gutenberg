/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/** @typedef {import('@playwright/test').Page} Page */
/** @typedef {import('@wordpress/e2e-test-utils-playwright').Editor} Editor */

/**
 * Some tests in this file use the character `|` to represent the caret's position
 * in a more readable format.
 */
test.describe( 'Multi-block selection', () => {
	test.use( {
		multiBlockSelectionUtils: async ( { page, editor }, use ) => {
			await use( new MultiBlockSelectionUtils( { page, editor } ) );
		},
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.describe( 'shift+arrow multi-selection', () => {
		test( 'should multi-select block with text selection and a block without text selection', async ( {
			page,
			editor,
			pageUtils,
			multiBlockSelectionUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'spacer below' },
			} );
			await editor.insertBlock( { name: 'core/spacer' } );
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'spacer above' },
			} );
			await page.keyboard.press( 'ArrowUp' ); // Go up one block - Spacer selected
			await page.keyboard.press( 'ArrowUp' ); // Go up one block - `spacer below` selected

			/*
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Spacer' } )
				.click( { modifiers: [ 'Shift' ] } ); // `spacer below` selected, Shift+click Spacer
			*/

			// `hi` selected, use Shift Arrow to select
			await pageUtils.pressKeys( 'Shift+ArrowDown', { times: 1 } );

			await expect
				.poll( multiBlockSelectionUtils.getSelectedBlocks )
				.toMatchObject( [
					{
						name: 'core/paragraph',
						attributes: { content: 'spacer below' },
					},
					{ name: 'core/spacer' },
				] );
		} );
	} );
} );

class MultiBlockSelectionUtils {
	/** @type {Page} */
	#page;
	/** @type {Editor} */
	#editor;

	constructor( { page, editor } ) {
		this.#page = page;
		this.#editor = editor;
	}

	getSelectedBlocks = async () => {
		return await this.#page.evaluate( () => {
			const {
				hasMultiSelection,
				hasSelectedBlock,
				getMultiSelectedBlocks,
				getSelectedBlock,
			} = window.wp.data.select( 'core/block-editor' );
			if ( hasMultiSelection() ) {
				return getMultiSelectedBlocks();
			} else if ( hasSelectedBlock() ) {
				return [ getSelectedBlock() ];
			}
			return [];
		} );
	};

	getSelectedFlatIndices = async () => {
		return await this.#page.evaluate( () => {
			const { getSelectedBlockClientIds, getClientIdsWithDescendants } =
				window.wp.data.select( 'core/block-editor' );
			const selectedClientIds = getSelectedBlockClientIds();
			const allClientIds = getClientIdsWithDescendants();
			return selectedClientIds.map(
				( clientId ) => allClientIds.indexOf( clientId ) + 1
			);
		} );
	};

	/**
	 * Tests if the native selection matches the block selection.
	 */
	assertNativeSelection = async () => {
		const selection = await this.#editor.canvas.evaluateHandle( () =>
			window.getSelection()
		);

		const { isMultiSelected, selectionStart, selectionEnd } =
			await this.#page.evaluate( () => {
				const {
					hasMultiSelection,
					getSelectionStart,
					getSelectionEnd,
				} = window.wp.data.select( 'core/block-editor' );
				return {
					isMultiSelected: hasMultiSelection(),
					selectionStart: getSelectionStart().clientId,
					selectionEnd: getSelectionEnd().clientId,
				};
			} );
		const startBlock = this.#editor.canvas.locator(
			`[data-block="${ selectionStart }"]`
		);
		const endBlock = this.#editor.canvas.locator(
			`[data-block="${ selectionEnd }"]`
		);

		expect(
			await selection.evaluate( ( _selection ) => _selection.rangeCount ),
			'Expected one range'
		).toBe( 1 );

		const range = await selection.evaluateHandle( ( _selection ) =>
			_selection.getRangeAt( 0 )
		);
		const isCollapsed = await range.evaluate(
			( { collapsed } ) => collapsed
		);

		if ( isMultiSelected ) {
			expect( isCollapsed, 'Expected an uncollapsed selection' ).toBe(
				false
			);

			expect(
				await startBlock.evaluate(
					( block, _selection ) =>
						_selection.containsNode( block, true ),
					selection
				),
				'Expected selection to include in the first selected block'
			).toBe( true );
			expect(
				await endBlock.evaluate(
					( block, _selection ) =>
						_selection.containsNode( block, true ),
					selection
				),
				'Expected selection to include in the last selected block'
			).toBe( true );
		} else {
			expect( isCollapsed, 'Expected a collapsed selection' ).toBe(
				true
			);

			expect(
				await startBlock.evaluate(
					( block, { startContainer, endContainer } ) =>
						block.contains( startContainer ) &&
						block.contains( endContainer ),
					range
				),
				'Expected selection to start and end in the selected block'
			).toBe( true );
		}
	};
}
