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
} from '@wordpress/e2e-test-utils';

describe( 'Align Hook Works As Expected', () => {
	const CHANGE_ALIGNMENT_BUTTON_SELECTOR = '.block-editor-block-toolbar .components-dropdown-menu__toggle[aria-label="Change alignment"]';

	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-align-hook' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-align-hook' );
	} );

	const getAlignmentToolbarLabels = async () => {
		await page.click( CHANGE_ALIGNMENT_BUTTON_SELECTOR );

		const buttonLabels = await page.evaluate( () => {
			return Array.from(
				document.querySelectorAll(
					'.components-dropdown-menu__menu button'
				)
			).map(
				( button ) => {
					return button.innerText;
				}
			);
		} );
		return buttonLabels;
	};

	const createShowsTheExpectedButtonsTest = ( blockName, buttonLabels ) => {
		it( 'Shows the expected buttons on the alignment toolbar',
			async () => {
				await insertBlock( blockName );

				expect(
					await getAlignmentToolbarLabels()
				).toEqual( buttonLabels );
			} );
	};

	const createDoesNotApplyAlignmentByDefaultTest = ( blockName ) => {
		it( 'Does not apply any alignment by default', async () => {
			await insertBlock( blockName );

			// verify no alignment button is in pressed state
			await page.click( CHANGE_ALIGNMENT_BUTTON_SELECTOR );
			const pressedButtons = await page.$$( '.components-dropdown-menu__menu button.is-active' );
			expect( pressedButtons ).toHaveLength( 0 );
		} );
	};

	const verifyMarkupIsValid = async ( htmlMarkup ) => {
		await setPostContent( htmlMarkup );
		const blocks = await getAllBlocks();
		expect( blocks ).toHaveLength( 1 );
		expect( blocks[ 0 ].isValid ).toBeTruthy();
	};

	const createCorrectlyAppliesAndRemovesAlignmentTest = ( blockName, alignment ) => {
		it( 'Correctly applies the selected alignment and correctly removes the alignment',
			async () => {
				const BUTTON_SELECTOR = `.components-dropdown-menu__menu button svg.dashicons-align-${ alignment }`;
				const BUTTON_PRESSED_SELECTOR = '.components-dropdown-menu__menu button.is-active';
				// set the specified alignment.
				await insertBlock( blockName );
				await page.click( CHANGE_ALIGNMENT_BUTTON_SELECTOR );
				await page.click( BUTTON_SELECTOR );

				// verify the button of the specified alignment is pressed.
				await page.click( CHANGE_ALIGNMENT_BUTTON_SELECTOR );
				let pressedButtons = await page.$$( BUTTON_PRESSED_SELECTOR );
				expect( pressedButtons ).toHaveLength( 1 );

				let htmlMarkup = await getEditedPostContent();

				// verify the markup of the selected alignment was generated.
				expect( htmlMarkup ).toMatchSnapshot();

				// verify the markup can be correctly parsed
				await verifyMarkupIsValid( htmlMarkup );

				await selectBlockByClientId(
					( await getAllBlocks() )[ 0 ].clientId
				);

				// remove the alignment.
				await page.click( CHANGE_ALIGNMENT_BUTTON_SELECTOR );
				await page.click( BUTTON_SELECTOR );

				// verify no alignment button is in pressed state.
				await page.click( CHANGE_ALIGNMENT_BUTTON_SELECTOR );
				pressedButtons = await page.$$( BUTTON_PRESSED_SELECTOR );
				expect( pressedButtons ).toHaveLength( 0 );

				// verify alignment markup was removed from the block.
				htmlMarkup = await getEditedPostContent();
				expect( htmlMarkup ).toMatchSnapshot();

				// verify the markup when no alignment is set is valid
				await verifyMarkupIsValid( htmlMarkup );

				await selectBlockByClientId(
					( await getAllBlocks() )[ 0 ].clientId
				);

				// verify no alignment button is in pressed state after parsing the block.
				await page.click( CHANGE_ALIGNMENT_BUTTON_SELECTOR );
				pressedButtons = await page.$$( BUTTON_PRESSED_SELECTOR );
				expect( pressedButtons ).toHaveLength( 0 );
			}
		);
	};

	describe( 'Block with no alignment set', () => {
		const BLOCK_NAME = 'Test No Alignment Set';
		it( 'Shows no alignment buttons on the alignment toolbar',
			async () => {
				await insertBlock( BLOCK_NAME );
				const changeAlignmentButton = await page.$( CHANGE_ALIGNMENT_BUTTON_SELECTOR );
				expect( changeAlignmentButton ).toBe( null );
			}
		);

		it( 'Does not save any alignment related attribute or class',
			async () => {
				await insertBlock( BLOCK_NAME );
				expect( await getEditedPostContent() ).toMatchSnapshot();
			}
		);
	} );

	describe( 'Block with align true', () => {
		const BLOCK_NAME = 'Test Align True';

		createShowsTheExpectedButtonsTest( BLOCK_NAME, [
			'Align Left',
			'Align Center',
			'Align Right',
			'Wide Width',
			'Full Width',
		] );

		createDoesNotApplyAlignmentByDefaultTest( BLOCK_NAME );

		createCorrectlyAppliesAndRemovesAlignmentTest( BLOCK_NAME, 'right' );
	} );

	describe( 'Block with align array', () => {
		const BLOCK_NAME = 'Test Align Array';

		createShowsTheExpectedButtonsTest( BLOCK_NAME, [
			'Align Left',
			'Align Center',
		] );

		createDoesNotApplyAlignmentByDefaultTest( BLOCK_NAME );

		createCorrectlyAppliesAndRemovesAlignmentTest( BLOCK_NAME, 'center' );
	} );

	describe( 'Block with default align', () => {
		const BLOCK_NAME = 'Test Default Align';
		const SELECTED_ALIGNMENT_CONTROL_SELECTOR = '//div[contains(@class, "components-dropdown-menu__menu")]//button[contains(@class, "is-active")][text()="Align Right"]';
		createShowsTheExpectedButtonsTest( BLOCK_NAME, [
			'Align Left',
			'Align Center',
			'Align Right',
			'Wide Width',
			'Full Width',
		] );

		it( 'Applies the selected alignment by default', async () => {
			await insertBlock( BLOCK_NAME );
			// verify the correct alignment button is pressed
			await page.click( CHANGE_ALIGNMENT_BUTTON_SELECTOR );
			const selectedAlignmentControls = await page.$x( SELECTED_ALIGNMENT_CONTROL_SELECTOR );
			expect( selectedAlignmentControls ).toHaveLength( 1 );
		} );

		it( 'The default markup does not contain the alignment attribute but contains the alignment class',
			async () => {
				await insertBlock( BLOCK_NAME );
				const markup = await getEditedPostContent();
				expect( markup ).not.toContain( '"align":"right"' );
				expect( markup ).toContain( 'alignright' );
			}
		);

		it( 'Can remove the default alignment and the align attribute equals none but alignnone class is not applied', async () => {
			await insertBlock( BLOCK_NAME );
			// remove the alignment.
			await page.click( CHANGE_ALIGNMENT_BUTTON_SELECTOR );
			const [ selectedAlignmentControl ] = await page.$x( SELECTED_ALIGNMENT_CONTROL_SELECTOR );
			await selectedAlignmentControl.click();
			const markup = await getEditedPostContent();
			expect( markup ).toContain( '"align":""' );
		} );

		createCorrectlyAppliesAndRemovesAlignmentTest( BLOCK_NAME, 'center' );
	} );
} );
