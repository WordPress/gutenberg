/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/** @typedef {import('@playwright/test').Page} Page */

test.use( {
	alignHookUtils: async ( { page, editor }, use ) => {
		await use( new AlignHookUtils( { page, editor } ) );
	},
} );

const alignLabels = {
	none: 'None',
	left: 'Align left',
	center: 'Align center',
	right: 'Align right',
	wide: 'Wide width',
	full: 'Full width',
};

class AlignHookUtils {
	constructor( { page, editor } ) {
		/** @type {Page} */
		this.page = page;
		this.editor = editor;
	}

	/**
	 * Helper function to get the `labels` of align control. It actually evaluates the
	 * basic label of the button without the `info` text node if exists.
	 *
	 * @param {Object}  options                               Options for the util function
	 * @param {boolean} [options.getActiveButtonLabels=false] Flag for returning the active buttons labels only.
	 * @return {Promise<string[]>} The matched labels.
	 */
	async getAlignmentToolbarLabels( { getActiveButtonLabels = false } = {} ) {
		const selector = `.components-dropdown-menu__menu button${
			getActiveButtonLabels ? '.is-active' : ''
		} .components-menu-item__item`;
		return await this.page.evaluate( ( _selector ) => {
			return (
				Array.from( document.querySelectorAll( _selector ) )
					/**
					 * We neede this for now because conditionally there could be two nodes
					 * with the same class(). This should be removed when the following
					 * issue is resolved.
					 *
					 * @see https://github.com/WordPress/gutenberg/issues/34838
					 */
					.filter(
						( contentNode ) => ! contentNode.childElementCount
					)
					.map( ( contentNode ) => {
						return contentNode.innerText;
					} )
			);
		}, selector );
	}
}

const createCorrectlyAppliesAndRemovesAlignmentTest = (
	blockName,
	alignment
) => {
	test( 'Correctly applies the selected alignment and correctly removes the alignment', async ( {
		editor,
		alignHookUtils,
	} ) => {
		const BUTTON_XPATH = `//button[contains(@class,'components-dropdown-menu__menu-item')]//span[contains(text(), '${ alignLabels[ alignment ] }')]`;

		// Set the specified alignment.
		await editor.insertBlock( { name: blockName } );
		await editor.clickBlockToolbarButton( 'Align' );
		await ( await this.page.$x( BUTTON_XPATH ) )[ 0 ].click();

		// Verify the button of the specified alignment is pressed.
		await editor.clickBlockToolbarButton( 'Align' );
		let activeButtonLabels = await alignHookUtils.getAlignmentToolbarLabels(
			{
				getActiveButtonLabels: true,
			}
		);
		expect( activeButtonLabels ).toHaveLength( 1 );
		expect( activeButtonLabels[ 0 ] ).toEqual( alignLabels[ alignment ] );

		let htmlMarkup = await editor.getEditedPostContent();

		// Verify the markup of the selected alignment was generated.
		expect( htmlMarkup ).toMatchSnapshot();

		// Verify the markup can be correctly parsed.
		let parsedBlocks = window.wp.blocks.parse( htmlMarkup );
		await this.page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/block-editor' )
				.resetBlocks( parsedBlocks );
		} );
		let blocks = await editor.getBlocks();
		expect( blocks ).toHaveLength( 1 );
		expect( blocks[ 0 ].isValid ).toBeTruthy();

		let clientId = ( await editor.getBlocks() )[ 0 ].clientId;

		await this.page.evaluate( ( id ) => {
			window.wp.data.dispatch( 'core/block-editor' ).selectBlock( id );
		}, clientId );

		// Remove the alignment.
		await editor.clickBlockToolbarButton( 'Align' );
		await ( await this.page.$x( BUTTON_XPATH ) )[ 0 ].click();

		// Verify 'none' alignment button is in pressed state.
		await editor.clickBlockToolbarButton( 'Align' );
		activeButtonLabels = await alignHookUtils.getAlignmentToolbarLabels( {
			getActiveButtonLabels: true,
		} );
		expect( activeButtonLabels ).toHaveLength( 1 );
		expect( activeButtonLabels[ 0 ] ).toEqual( alignLabels.none );

		// Verify alignment markup was removed from the block.
		htmlMarkup = await editor.getEditedPostContent();
		expect( htmlMarkup ).toMatchSnapshot();

		// verify the markup when no alignment is set is valid
		parsedBlocks = window.wp.blocks.parse( htmlMarkup );
		await this.page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/block-editor' )
				.resetBlocks( parsedBlocks );
		} );

		blocks = await editor.getBlocks();
		expect( blocks ).toHaveLength( 1 );
		expect( blocks[ 0 ].isValid ).toBeTruthy();

		clientId = ( await editor.getBlocks() )[ 0 ].clientId;

		await this.page.evaluate( ( id ) => {
			window.wp.data.dispatch( 'core/block-editor' ).selectBlock( id );
		}, clientId );

		// Verify alignment `none` button is in pressed state after parsing the block.
		await editor.clickBlockToolbarButton( 'Align' );
		activeButtonLabels = await alignHookUtils.getAlignmentToolbarLabels( {
			getActiveButtonLabels: true,
		} );
		expect( activeButtonLabels ).toHaveLength( 1 );
		expect( activeButtonLabels[ 0 ] ).toEqual( alignLabels.none );
	} );
};

test.describe( 'Align Hook Works As Expected', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-align-hook' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-align-hook' );
	} );

	test.describe( 'Block with no alignment set', () => {
		const BLOCK_NAME = 'Test No Alignment Set';
		test( 'Shows no alignment buttons on the alignment toolbar', async ( {
			editor,
		} ) => {
			await editor.insertBlock( { name: BLOCK_NAME } );
			const CHANGE_ALIGNMENT_BUTTON_SELECTOR =
				'.block-editor-block-toolbar .components-dropdown-menu__toggle[aria-label="Align"]';
			const changeAlignmentButton = this.page.locator(
				CHANGE_ALIGNMENT_BUTTON_SELECTOR
			);
			expect( changeAlignmentButton ).toBe( null );
		} );

		test( 'Does not save any alignment related attribute or class', async ( {
			editor,
		} ) => {
			await editor.insertBlock( { name: BLOCK_NAME } );
			expect( await editor.getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	test.describe( 'Block with align true', () => {
		const BLOCK_NAME = 'Test Align True';

		test( 'Shows the expected buttons on the alignment toolbar', async ( {
			editor,
			alignHookUtils,
		} ) => {
			await editor.insertBlock( { name: BLOCK_NAME } );
			await editor.clickBlockToolbarButton( 'Align' );
			expect( await alignHookUtils.getAlignmentToolbarLabels() ).toEqual(
				expect.arrayContaining( Object.values( alignLabels ) )
			);
		} );

		test( 'applies none alignment by default', async ( {
			editor,
			alignHookUtils,
		} ) => {
			await editor.insertBlock( { name: BLOCK_NAME } );
			await editor.clickBlockToolbarButton( 'Align' );
			const activeButtonLabels =
				await alignHookUtils.getAlignmentToolbarLabels( {
					getActiveButtonLabels: true,
				} );
			expect( activeButtonLabels ).toHaveLength( 1 );
			expect( activeButtonLabels[ 0 ] ).toEqual( alignLabels.none );
		} );

		createCorrectlyAppliesAndRemovesAlignmentTest( BLOCK_NAME, 'right' );
	} );

	test.describe( 'Block with align array', () => {
		const BLOCK_NAME = 'Test Align Array';

		test( 'Shows the expected buttons on the alignment toolbar', async ( {
			editor,
			alignHookUtils,
		} ) => {
			await editor.insertBlock( { name: BLOCK_NAME } );
			await editor.clickBlockToolbarButton( 'Align' );
			expect( await alignHookUtils.getAlignmentToolbarLabels() ).toEqual(
				expect.arrayContaining( [
					alignLabels.none,
					alignLabels.left,
					alignLabels.center,
				] )
			);
		} );

		test( 'applies none alignment by default', async ( {
			editor,
			alignHookUtils,
		} ) => {
			await editor.insertBlock( { name: BLOCK_NAME } );
			await editor.clickBlockToolbarButton( 'Align' );
			const activeButtonLabels =
				await alignHookUtils.getAlignmentToolbarLabels( {
					getActiveButtonLabels: true,
				} );
			expect( activeButtonLabels ).toHaveLength( 1 );
			expect( activeButtonLabels[ 0 ] ).toEqual( alignLabels.none );
		} );

		createCorrectlyAppliesAndRemovesAlignmentTest( BLOCK_NAME, 'center' );
	} );

	test.describe( 'Block with default align', () => {
		const BLOCK_NAME = 'Test Default Align';
		const SELECTED_ALIGNMENT_CONTROL_SELECTOR =
			'//div[contains(@class, "components-dropdown-menu__menu")]//button[contains(@class, "is-active")]/span[text()="Align right"]';

		test( 'Shows the expected buttons on the alignment toolbar', async ( {
			editor,
			alignHookUtils,
		} ) => {
			await editor.insertBlock( { name: BLOCK_NAME } );
			await editor.clickBlockToolbarButton( 'Align' );
			expect( await alignHookUtils.getAlignmentToolbarLabels() ).toEqual(
				expect.arrayContaining( Object.values( alignLabels ) )
			);
		} );

		test( 'Applies the selected alignment by default', async ( {
			editor,
		} ) => {
			await editor.insertBlock( { name: BLOCK_NAME } );
			// Verify the correct alignment button is pressed.
			await editor.clickBlockToolbarButton( 'Align' );
			const selectedAlignmentControls = await this.page.$x(
				SELECTED_ALIGNMENT_CONTROL_SELECTOR
			);
			expect( selectedAlignmentControls ).toHaveLength( 1 );
		} );

		test( 'The default markup does not contain the alignment attribute but contains the alignment class', async ( {
			editor,
		} ) => {
			await editor.insertBlock( { name: BLOCK_NAME } );
			const markup = await editor.getEditedPostContent();
			expect( markup ).not.toContain( '"align":"right"' );
			expect( markup ).toContain( 'alignright' );
		} );

		test( 'Can remove the default alignment and the align attribute equals none but alignnone class is not applied', async ( {
			editor,
		} ) => {
			await editor.insertBlock( { name: BLOCK_NAME } );
			// Remove the alignment.
			await editor.clickBlockToolbarButton( 'Align' );
			const [ selectedAlignmentControl ] = await this.page.$x(
				SELECTED_ALIGNMENT_CONTROL_SELECTOR
			);
			await selectedAlignmentControl.click();
			const markup = await editor.getEditedPostContent();
			expect( markup ).toContain( '"align":""' );
		} );

		createCorrectlyAppliesAndRemovesAlignmentTest( BLOCK_NAME, 'center' );
	} );
} );
