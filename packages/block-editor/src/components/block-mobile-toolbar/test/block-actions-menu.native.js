/**
 * External dependencies
 */
import {
	addBlock,
	fireEvent,
	initializeEditor,
	getBlock,
	within,
	getEditorHtml,
	typeInRichText,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

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

describe( 'Block Actions Menu', () => {
	it( "renders the block name in the Picker's header", async () => {
		const screen = await initializeEditor( {
			initialHtml: `<!-- wp:paragraph -->
            <p></p>
            <!-- /wp:paragraph -->`,
		} );
		const { getByLabelText, getByRole } = screen;

		// Get block
		const paragraphBlock = await getBlock( screen, 'Paragraph' );
		fireEvent.press( paragraphBlock );

		// Open block actions menu
		const blockActionsButton = getByLabelText( /Open Block Actions Menu/ );
		fireEvent.press( blockActionsButton );

		// Get Picker title
		const pickerHeader = getByRole( 'header' );
		const headerTitle = within( pickerHeader ).getByText(
			/Paragraph block options/
		);
		expect( headerTitle ).toBeVisible();
	} );

	describe( 'moving blocks', () => {
		it( 'moves blocks up and down', async () => {
			const screen = await initializeEditor( {
				screenWidth: 100, // To collapse the up/arrow buttons bellow blocks
			} );
			const { getByLabelText, getByTestId } = screen;

			// Add Paragraph block
			await addBlock( screen, 'Paragraph' );

			// Get Paragraph block
			const paragraphBlock = await getBlock( screen, 'Paragraph' );
			fireEvent.press( paragraphBlock );
			const paragraphField =
				within( paragraphBlock ).getByPlaceholderText(
					'Start writing…'
				);
			typeInRichText( paragraphField, 'Hello!' );

			// Add Spacer block
			await addBlock( screen, 'Spacer' );

			// Add Heading block
			await addBlock( screen, 'Heading' );

			// Get Spacer block
			const spacerBlock = await getBlock( screen, 'Spacer', {
				rowIndex: 2,
			} );
			fireEvent.press( spacerBlock );

			// Open block actions menu
			fireEvent.press( getByLabelText( /Open Block Actions Menu/ ) );

			// Get block actions modal
			let blockActionsMenu = await getByTestId( 'block-actions-menu' );

			// Tap on the Move Down button
			fireEvent.press(
				within( blockActionsMenu ).getByLabelText( 'Move block down' )
			);

			// Get Heading block
			const headingBlock = await getBlock( screen, 'Heading', {
				rowIndex: 2,
			} );
			fireEvent.press( headingBlock );

			// Open block actions menu
			fireEvent.press( getByLabelText( /Open Block Actions Menu/ ) );

			// Get block actions modal
			blockActionsMenu = await getByTestId( 'block-actions-menu' );

			// Tap on the Move Up button
			fireEvent.press(
				within( blockActionsMenu ).getByLabelText( 'Move block up' )
			);

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'disables the Move Up button for the first block', async () => {
			const screen = await initializeEditor( {
				screenWidth: 100, // To collapse the up/arrow buttons bellow blocks
			} );
			const { getByLabelText, getByTestId } = screen;

			// Add Paragraph block
			await addBlock( screen, 'Paragraph' );

			// Get Paragraph block
			let paragraphBlock = await getBlock( screen, 'Paragraph' );
			fireEvent.press( paragraphBlock );
			const paragraphField =
				within( paragraphBlock ).getByPlaceholderText(
					'Start writing…'
				);
			typeInRichText( paragraphField, 'Hello!' );

			// Add Spacer block
			await addBlock( screen, 'Spacer' );

			// Add Heading block
			await addBlock( screen, 'Heading' );

			// Get Paragraph block
			paragraphBlock = await getBlock( screen, 'Paragraph' );
			fireEvent.press( paragraphBlock );

			// Open block actions menu
			fireEvent.press( getByLabelText( /Open Block Actions Menu/ ) );

			// Get block actions modal
			const blockActionsMenu = await getByTestId( 'block-actions-menu' );

			// Get the Move Up button
			const upButton =
				within( blockActionsMenu ).getByLabelText( 'Move block up' );
			const isUpButtonDisabled =
				upButton.props.accessibilityState?.disabled;
			expect( isUpButtonDisabled ).toBe( true );

			// Press the button to make sure the block doesn't move
			fireEvent.press( upButton );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'disables the Move Down button for the last block', async () => {
			const screen = await initializeEditor( {
				screenWidth: 100,
			} );
			const { getByLabelText, getByTestId } = screen;

			// Add Paragraph block
			await addBlock( screen, 'Paragraph' );

			// Get Paragraph block
			const paragraphBlock = await getBlock( screen, 'Paragraph' );
			fireEvent.press( paragraphBlock );
			const paragraphField =
				within( paragraphBlock ).getByPlaceholderText(
					'Start writing…'
				);
			typeInRichText( paragraphField, 'Hello!' );

			// Add Spacer block
			await addBlock( screen, 'Spacer' );

			// Add Heading block
			await addBlock( screen, 'Heading' );

			// Get Heading block
			const headingBlock = await getBlock( screen, 'Heading', {
				rowIndex: 3,
			} );
			fireEvent.press( headingBlock );

			// Open block actions menu
			fireEvent.press( getByLabelText( /Open Block Actions Menu/ ) );

			// Get block actions modal
			const blockActionsMenu = await getByTestId( 'block-actions-menu' );

			// Get the Move Down button
			const downButton =
				within( blockActionsMenu ).getByLabelText( 'Move block down' );
			const isDownButtonDisabled =
				downButton.props.accessibilityState?.disabled;
			expect( isDownButtonDisabled ).toBe( true );

			// Press the button to make sure the block doesn't move
			fireEvent.press( downButton );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );
	} );

	describe( 'block options', () => {
		it( 'copies and pastes a block', async () => {
			const screen = await initializeEditor();
			const { getByLabelText } = screen;

			// Add Paragraph block
			await addBlock( screen, 'Paragraph' );

			// Get Paragraph block
			let paragraphBlock = await getBlock( screen, 'Paragraph' );
			fireEvent.press( paragraphBlock );
			const paragraphField =
				within( paragraphBlock ).getByPlaceholderText(
					'Start writing…'
				);
			typeInRichText( paragraphField, 'Hello!' );

			// Add Spacer block
			await addBlock( screen, 'Spacer' );

			// Add Heading block
			await addBlock( screen, 'Heading' );

			// Get Heading block
			const headingBlock = await getBlock( screen, 'Heading', {
				rowIndex: 3,
			} );
			fireEvent.press( headingBlock );

			// Open block actions menu
			fireEvent.press( getByLabelText( /Open Block Actions Menu/ ) );

			// Tap on the Copy button
			fireEvent.press( getByLabelText( /Copy/ ) );

			// Get Paragraph block
			paragraphBlock = await getBlock( screen, 'Paragraph' );
			fireEvent.press( paragraphBlock );

			// Open block actions menu
			fireEvent.press( getByLabelText( /Open Block Actions Menu/ ) );

			// Tap on the Paste block after button
			fireEvent.press( getByLabelText( /Paste block after/ ) );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'does not replace a non empty Paragraph block when pasting another block', async () => {
			const screen = await initializeEditor();
			const { getByLabelText } = screen;

			// Add Paragraph block
			await addBlock( screen, 'Paragraph' );

			// Get Paragraph block
			let paragraphBlock = await getBlock( screen, 'Paragraph' );
			fireEvent.press( paragraphBlock );
			const paragraphField =
				within( paragraphBlock ).getByPlaceholderText(
					'Start writing…'
				);
			typeInRichText( paragraphField, 'Hello!' );

			// Add Spacer block
			await addBlock( screen, 'Spacer' );

			// Add Heading block
			await addBlock( screen, 'Heading' );

			// Get Heading block
			const headingBlock = await getBlock( screen, 'Heading', {
				rowIndex: 3,
			} );
			fireEvent.press( headingBlock );

			// Open block actions menu
			fireEvent.press( getByLabelText( /Open Block Actions Menu/ ) );

			// Tap on the Copy button
			fireEvent.press( getByLabelText( /Copy/ ) );

			// Get Paragraph block
			paragraphBlock = await getBlock( screen, 'Paragraph' );
			fireEvent.press( paragraphBlock );

			// Open block actions menu
			fireEvent.press( getByLabelText( /Open Block Actions Menu/ ) );

			// Tap on the Past block after button
			fireEvent.press( getByLabelText( /Paste block after/ ) );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'cuts and pastes a block', async () => {
			const screen = await initializeEditor();
			const { getByLabelText } = screen;

			// Add Paragraph block
			await addBlock( screen, 'Paragraph' );

			// Get Paragraph block
			let paragraphBlock = await getBlock( screen, 'Paragraph' );
			fireEvent.press( paragraphBlock );
			const paragraphField =
				within( paragraphBlock ).getByPlaceholderText(
					'Start writing…'
				);
			typeInRichText( paragraphField, 'Hello!' );

			// Add Spacer block
			await addBlock( screen, 'Spacer' );

			// Add Heading block
			await addBlock( screen, 'Heading' );

			// Get Paragraph block
			paragraphBlock = await getBlock( screen, 'Paragraph' );
			fireEvent.press( paragraphBlock );

			// Open block actions menu
			fireEvent.press( getByLabelText( /Open Block Actions Menu/ ) );

			// Tap on the Cut button
			fireEvent.press( getByLabelText( /Cut block/ ) );

			const headingBlock = await getBlock( screen, 'Heading', {
				rowIndex: 2,
			} );
			fireEvent.press( headingBlock );

			// Open block actions menu
			fireEvent.press( getByLabelText( /Open Block Actions Menu/ ) );

			// Tap on the Cut button
			fireEvent.press( getByLabelText( /Paste block after/ ) );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'duplicates a block', async () => {
			const screen = await initializeEditor();
			const { getByLabelText } = screen;

			// Add Paragraph block
			await addBlock( screen, 'Paragraph' );

			// Get Paragraph block
			const paragraphBlock = await getBlock( screen, 'Paragraph' );
			fireEvent.press( paragraphBlock );
			const paragraphField =
				within( paragraphBlock ).getByPlaceholderText(
					'Start writing…'
				);
			typeInRichText( paragraphField, 'Hello!' );

			// Add Spacer block
			await addBlock( screen, 'Spacer' );

			// Add Heading block
			await addBlock( screen, 'Heading' );

			// Get Spacer block
			const spacerBlock = await getBlock( screen, 'Spacer', {
				rowIndex: 2,
			} );
			fireEvent.press( spacerBlock );

			// Open block actions menu
			fireEvent.press( getByLabelText( /Open Block Actions Menu/ ) );

			// Tap on the Duplicate button
			fireEvent.press( getByLabelText( /Duplicate block/ ) );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );

		it( 'transforms a Paragraph block into a Pullquote block', async () => {
			const screen = await initializeEditor();
			const { getByLabelText, getByRole } = screen;

			// Add Paragraph block
			await addBlock( screen, 'Paragraph' );

			// Get Paragraph block
			let paragraphBlock = await getBlock( screen, 'Paragraph' );
			fireEvent.press( paragraphBlock );
			const paragraphField =
				within( paragraphBlock ).getByPlaceholderText(
					'Start writing…'
				);
			typeInRichText( paragraphField, 'Hello!' );

			// Add Spacer block
			await addBlock( screen, 'Spacer' );

			// Add Heading block
			await addBlock( screen, 'Heading' );

			// Get Paragraph block
			paragraphBlock = await getBlock( screen, 'Paragraph' );
			fireEvent.press( paragraphBlock );

			// Open block actions menu
			fireEvent.press( getByLabelText( /Open Block Actions Menu/ ) );

			// Tap on the Transform block button
			fireEvent.press( getByLabelText( /Transform block…/ ) );

			// Get Picker title
			const pickerHeader = getByRole( 'header' );
			const headerTitle = within( pickerHeader ).getByText(
				/Transform Paragraph to/
			);
			expect( headerTitle ).toBeVisible();

			// Tap on the Transform block button
			fireEvent.press( getByLabelText( /Pullquote/ ) );

			expect( getEditorHtml() ).toMatchSnapshot();
		} );
	} );
} );
