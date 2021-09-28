/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	getAllBlocks,
	getEditedPostContent,
	insertBlock,
	selectBlockByClientId,
	setPostContent,
	clickBlockToolbarButton,
} from '@wordpress/e2e-test-utils';

const alignLabels = {
	none: 'None',
	left: 'Align left',
	center: 'Align center',
	right: 'Align right',
	wide: 'Wide width',
	full: 'Full width',
};

/**
 * Helper function to get the `labels` of align control. It actually evaluates the
 * basic label of the button without the `info` text node if exists.
 *
 * @param {Object}  options                               Options for the util function
 * @param {boolean} [options.getActiveButtonLabels=false] Flag for returning the active buttons labels only.
 * @return {string[]} The matched labels.
 */
const getAlignmentToolbarLabels = async ( {
	getActiveButtonLabels = false,
} = {} ) => {
	const selector = `.components-dropdown-menu__menu button${
		getActiveButtonLabels ? '.is-active' : ''
	} .components-menu-item__item`;
	return page.evaluate( ( _selector ) => {
		return (
			Array.from( document.querySelectorAll( _selector ) )
				/**
				 * We neede this for now because conditionally there could be two nodes
				 * with the same class(). This should be removed when the following
				 * issue is resolved.
				 *
				 * @see https://github.com/WordPress/gutenberg/issues/34838
				 */
				.filter( ( contentNode ) => ! contentNode.childElementCount )
				.map( ( contentNode ) => {
					return contentNode.innerText;
				} )
		);
	}, selector );
};

const expectActiveButtonLabelToBe = async ( expected ) => {
	await clickBlockToolbarButton( 'Align' );
	const activeButtonLabels = await getAlignmentToolbarLabels( {
		getActiveButtonLabels: true,
	} );
	expect( activeButtonLabels ).toHaveLength( 1 );
	expect( activeButtonLabels[ 0 ] ).toEqual( expected );
};

const createShowsTheExpectedButtonsTest = ( blockName, buttonLabels ) => {
	it( 'Shows the expected buttons on the alignment toolbar', async () => {
		await insertBlock( blockName );
		await clickBlockToolbarButton( 'Align' );
		expect( await getAlignmentToolbarLabels() ).toEqual(
			expect.arrayContaining( buttonLabels )
		);
	} );
};

const createAppliesNoneAlignmentByDefaultTest = ( blockName ) => {
	it( 'applies none alignment by default', async () => {
		await insertBlock( blockName );
		await expectActiveButtonLabelToBe( alignLabels.none );
	} );
};

const verifyMarkupIsValid = async ( htmlMarkup ) => {
	await setPostContent( htmlMarkup );
	const blocks = await getAllBlocks();
	expect( blocks ).toHaveLength( 1 );
	expect( blocks[ 0 ].isValid ).toBeTruthy();
};

const createCorrectlyAppliesAndRemovesAlignmentTest = (
	blockName,
	alignment
) => {
	it( 'Correctly applies the selected alignment and correctly removes the alignment', async () => {
		const BUTTON_XPATH = `//button[contains(@class,'components-dropdown-menu__menu-item')]//span[contains(text(), '${ alignLabels[ alignment ] }')]`;

		// set the specified alignment.
		await insertBlock( blockName );
		await clickBlockToolbarButton( 'Align' );
		await ( await page.$x( BUTTON_XPATH ) )[ 0 ].click();

		// verify the button of the specified alignment is pressed.
		await expectActiveButtonLabelToBe( alignLabels[ alignment ] );

		let htmlMarkup = await getEditedPostContent();

		// verify the markup of the selected alignment was generated.
		expect( htmlMarkup ).toMatchSnapshot();

		// verify the markup can be correctly parsed
		await verifyMarkupIsValid( htmlMarkup );

		await selectBlockByClientId( ( await getAllBlocks() )[ 0 ].clientId );

		// remove the alignment.
		await clickBlockToolbarButton( 'Align' );
		await ( await page.$x( BUTTON_XPATH ) )[ 0 ].click();

		// verify 'none' alignment button is in pressed state.
		await expectActiveButtonLabelToBe( alignLabels.none );

		// verify alignment markup was removed from the block.
		htmlMarkup = await getEditedPostContent();
		expect( htmlMarkup ).toMatchSnapshot();

		// verify the markup when no alignment is set is valid
		await verifyMarkupIsValid( htmlMarkup );

		await selectBlockByClientId( ( await getAllBlocks() )[ 0 ].clientId );

		// verify alignment `none` button is in pressed state after parsing the block.
		await expectActiveButtonLabelToBe( alignLabels.none );
	} );
};

describe( 'Align Hook Works As Expected', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-align-hook' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-align-hook' );
	} );

	describe( 'Block with no alignment set', () => {
		const BLOCK_NAME = 'Test No Alignment Set';
		it( 'Shows no alignment buttons on the alignment toolbar', async () => {
			await insertBlock( BLOCK_NAME );
			const CHANGE_ALIGNMENT_BUTTON_SELECTOR =
				'.block-editor-block-toolbar .components-dropdown-menu__toggle[aria-label="Align"]';
			const changeAlignmentButton = await page.$(
				CHANGE_ALIGNMENT_BUTTON_SELECTOR
			);
			expect( changeAlignmentButton ).toBe( null );
		} );

		it( 'Does not save any alignment related attribute or class', async () => {
			await insertBlock( BLOCK_NAME );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	describe( 'Block with align true', () => {
		const BLOCK_NAME = 'Test Align True';

		createShowsTheExpectedButtonsTest(
			BLOCK_NAME,
			Object.values( alignLabels )
		);

		createAppliesNoneAlignmentByDefaultTest( BLOCK_NAME );

		createCorrectlyAppliesAndRemovesAlignmentTest( BLOCK_NAME, 'right' );
	} );

	describe( 'Block with align array', () => {
		const BLOCK_NAME = 'Test Align Array';

		createShowsTheExpectedButtonsTest( BLOCK_NAME, [
			alignLabels.none,
			alignLabels.left,
			alignLabels.center,
		] );

		createAppliesNoneAlignmentByDefaultTest( BLOCK_NAME );

		createCorrectlyAppliesAndRemovesAlignmentTest( BLOCK_NAME, 'center' );
	} );

	describe( 'Block with default align', () => {
		const BLOCK_NAME = 'Test Default Align';
		const SELECTED_ALIGNMENT_CONTROL_SELECTOR =
			'//div[contains(@class, "components-dropdown-menu__menu")]//button[contains(@class, "is-active")]/span[text()="Align right"]';
		createShowsTheExpectedButtonsTest(
			BLOCK_NAME,
			Object.values( alignLabels )
		);

		it( 'Applies the selected alignment by default', async () => {
			await insertBlock( BLOCK_NAME );
			// verify the correct alignment button is pressed
			await clickBlockToolbarButton( 'Align' );
			const selectedAlignmentControls = await page.$x(
				SELECTED_ALIGNMENT_CONTROL_SELECTOR
			);
			expect( selectedAlignmentControls ).toHaveLength( 1 );
		} );

		it( 'The default markup does not contain the alignment attribute but contains the alignment class', async () => {
			await insertBlock( BLOCK_NAME );
			const markup = await getEditedPostContent();
			expect( markup ).not.toContain( '"align":"right"' );
			expect( markup ).toContain( 'alignright' );
		} );

		it( 'Can remove the default alignment and the align attribute equals none but alignnone class is not applied', async () => {
			await insertBlock( BLOCK_NAME );
			// remove the alignment.
			await clickBlockToolbarButton( 'Align' );
			const [ selectedAlignmentControl ] = await page.$x(
				SELECTED_ALIGNMENT_CONTROL_SELECTOR
			);
			await selectedAlignmentControl.click();
			const markup = await getEditedPostContent();
			expect( markup ).toContain( '"align":""' );
		} );

		createCorrectlyAppliesAndRemovesAlignmentTest( BLOCK_NAME, 'center' );
	} );
} );
