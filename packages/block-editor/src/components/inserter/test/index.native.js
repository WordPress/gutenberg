/**
 * External dependencies
 */
import {
	addBlock,
	fireEvent,
	initializeEditor,
	getBlock,
	getEditorHtml,
	render,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import { Inserter } from '../index';

const getStylesFromColorScheme = () => {
	return { color: 'white' };
};

describe( 'Inserter', () => {
	it( 'button contains the testID "add-block-button"', () => {
		const screen = render(
			<Inserter getStylesFromColorScheme={ getStylesFromColorScheme } />
		);

		expect( screen.getByTestId( 'add-block-button' ) ).toBeTruthy();
	} );

	describe( 'can add blocks', () => {
		beforeAll( () => {
			// Register all core blocks
			registerCoreBlocks();
		} );

		afterAll( () => {
			// Clean up registered blocks
			getBlockTypes().forEach( ( block ) => {
				unregisterBlockType( block.name );
			} );
		} );

		it( 'to the beginning', async () => {
			const screen = await initializeEditor();
			const { getByLabelText, getByTestId } = screen;

			// Add Spacer block
			await addBlock( screen, 'Spacer' );

			// Add Heading block
			await addBlock( screen, 'Heading' );

			// Add Paragraph block
			await addBlock( screen, 'Paragraph' );

			// Get Inserter button
			const addBlockButton = await getByTestId( 'add-block-button' );

			// Long press the inserter button
			fireEvent( addBlockButton, 'onLongPress' );

			// Get Add To Beginning option
			const addBlockToBeginningButton =
				await getByLabelText( 'Add To Beginning' );
			expect( addBlockToBeginningButton ).toBeVisible();
			fireEvent.press( addBlockToBeginningButton );

			// Add another block at the beginning
			await addBlock( screen, 'More', { isPickerOpened: true } );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'before another block', async () => {
			const screen = await initializeEditor();
			const { getByLabelText, getByTestId } = screen;

			// Add Paragraph block
			await addBlock( screen, 'Paragraph' );

			// Get Paragraph block
			const paragraphBlock = await getBlock( screen, 'Paragraph' );
			fireEvent.press( paragraphBlock );

			// Get Inserter button
			const addBlockButton = await getByTestId( 'add-block-button' );

			// Long press the inserter button
			fireEvent( addBlockButton, 'onLongPress' );

			// Get Add Block Before option
			const addBlockBeforeButton =
				await getByLabelText( 'Add Block Before' );
			expect( addBlockBeforeButton ).toBeVisible();
			fireEvent.press( addBlockBeforeButton );

			// Add another block before the first one
			await addBlock( screen, 'Heading', { isPickerOpened: true } );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'after another block', async () => {
			const screen = await initializeEditor();
			const { getByLabelText, getByTestId } = screen;

			// Add Spacer block
			await addBlock( screen, 'Spacer' );

			// Add Heading block
			await addBlock( screen, 'Heading' );

			// Add Paragraph block
			await addBlock( screen, 'Paragraph' );

			// Get Heading block
			const headingBlock = await getBlock( screen, 'Heading', {
				rowIndex: 2,
			} );
			fireEvent.press( headingBlock );

			// Get Inserter button
			const addBlockButton = await getByTestId( 'add-block-button' );

			// Long press the inserter button
			fireEvent( addBlockButton, 'onLongPress' );

			// Get Add Block After option
			const addBlockAfterButton =
				await getByLabelText( 'Add Block After' );
			expect( addBlockAfterButton ).toBeVisible();
			fireEvent.press( addBlockAfterButton );

			// Add another block after the Heading block
			await addBlock( screen, 'More', { isPickerOpened: true } );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'to the end', async () => {
			const screen = await initializeEditor();
			const { getByLabelText, getByTestId } = screen;

			// Add Spacer block
			await addBlock( screen, 'Spacer' );

			// Add Heading block
			await addBlock( screen, 'Heading' );

			// Add Paragraph block
			await addBlock( screen, 'Paragraph' );

			// Get Spacer block
			const spacerBlock = await getBlock( screen, 'Spacer' );
			fireEvent.press( spacerBlock );

			// Get Inserter button
			const addBlockButton = await getByTestId( 'add-block-button' );

			// Long press the inserter button
			fireEvent( addBlockButton, 'onLongPress' );

			// Get Add To End option
			const addBlockToEndButton = await getByLabelText( 'Add To End' );
			expect( addBlockToEndButton ).toBeVisible();
			fireEvent.press( addBlockToEndButton );

			// Add another block to the end after the Paragraph Block
			await addBlock( screen, 'More', { isPickerOpened: true } );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'adds new block at the end of post', async () => {
			const screen = await initializeEditor();

			// Add Spacer block
			await addBlock( screen, 'Spacer' );

			// Add Heading block
			await addBlock( screen, 'Heading' );

			// Get Heading block
			const headingBlock = await getBlock( screen, 'Heading', {
				rowIndex: 2,
			} );
			expect( headingBlock ).toBeVisible();

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'inserts between 2 existing blocks', async () => {
			const screen = await initializeEditor();

			// Add Spacer block
			await addBlock( screen, 'Spacer' );

			// Add Heading block
			await addBlock( screen, 'Heading' );

			// Get Spacer block
			const spacerBlock = await getBlock( screen, 'Spacer' );
			fireEvent.press( spacerBlock );

			// Add More block
			await addBlock( screen, 'More' );

			// Get More block
			const moreBlock = await getBlock( screen, 'More', { rowIndex: 2 } );
			expect( moreBlock ).toBeVisible();

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'inserts block at the end of post when no block is selected', async () => {
			const screen = await initializeEditor();
			const { getAllByLabelText } = screen;

			// Add Spacer block
			await addBlock( screen, 'Spacer' );

			// Add Heading block
			await addBlock( screen, 'Heading' );

			// Select the title
			const titleInputElement =
				await getAllByLabelText( 'Post title. test' )[ 0 ];
			expect( titleInputElement ).toBeVisible();
			fireEvent.press( titleInputElement );

			// Add More block
			await addBlock( screen, 'More' );

			// Get More block
			const moreBlock = await getBlock( screen, 'More', { rowIndex: 3 } );
			expect( moreBlock ).toBeVisible();

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'creates a new Paragraph block tapping on the empty area below the last block', async () => {
			const screen = await initializeEditor();
			const { getByLabelText } = screen;

			// Add Spacer block
			await addBlock( screen, 'Spacer' );

			// Add Heading block
			await addBlock( screen, 'Heading' );

			// Get the empty paragraph placeholder
			const paragraphPlaceholder = await getByLabelText(
				'Add paragraph block'
			);
			fireEvent.press( paragraphPlaceholder );

			// Get Paragraph block
			const paragraphBlock = await getBlock( screen, 'Paragraph', {
				rowIndex: 3,
			} );
			expect( paragraphBlock ).toBeVisible();

			expect( getEditorHtml() ).toMatchSnapshot();
		} );
	} );
} );
