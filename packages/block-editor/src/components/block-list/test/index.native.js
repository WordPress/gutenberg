/**
 * External dependencies
 */
import {
	addBlock,
	getBlock,
	fireEvent,
	initializeEditor,
	screen,
	setupCoreBlocks,
	triggerBlockListLayout,
	within,
} from 'test/helpers';

setupCoreBlocks();

describe( 'BlockList', () => {
	describe( 'when empty', () => {
		beforeEach( async () => {
			// Arrange
			await initializeEditor();
		} );

		it( 'renders a post title', async () => {
			// Assert
			expect( screen.getByPlaceholderText( 'Add title' ) ).toBeTruthy();
		} );

		it( 'renders a block appender as a content placeholder', async () => {
			// Act
			const appender = screen.getByPlaceholderText( /Start writing/ );
			fireEvent.press( appender );

			// Assert
			expect( await getBlock( screen, 'Paragraph' ) ).toBeVisible();
		} );

		it( 'renders an end-of-list paragraph appender', async () => {
			// Act
			const appender = screen.getByLabelText( 'Add paragraph block' );
			fireEvent.press( appender );

			// Assert
			expect( await getBlock( screen, 'Paragraph' ) ).toBeVisible();
		} );
	} );

	describe( 'when not empty', () => {
		it( 'renders a footer appender', async () => {
			// Arrange
			await initializeEditor();
			await addBlock( screen, 'Social Icons' );
			const socialLinksBlock = await getBlock( screen, 'Social Icons' );
			fireEvent.press( socialLinksBlock );
			await triggerBlockListLayout( socialLinksBlock );

			// Act
			fireEvent.press(
				within( socialLinksBlock ).getByTestId( 'appender-button' )
			);
			const blockList = screen.getByTestId( 'InserterUI-Blocks' );
			fireEvent.scroll( blockList, {
				nativeEvent: {
					contentOffset: { y: 0, x: 0 },
					contentSize: { width: 100, height: 100 },
					layoutMeasurement: { width: 100, height: 100 },
				},
			} );
			fireEvent.press( await screen.findByText( 'Amazon' ) );

			// Assert
			const amazonSettings = await screen.findByTestId(
				'navigation-screen-LinkSettingsScreen'
			);
			expect( amazonSettings ).toBeVisible();
		} );
	} );

	describe( 'for inner blocks', () => {
		it( 'renders an inner block appender', async () => {
			// Arrange
			await initializeEditor();
			await addBlock( screen, 'Group' );
			const groupBlock = await getBlock( screen, 'Group' );
			await triggerBlockListLayout( groupBlock );

			// Assert
			expect(
				within( groupBlock ).getByTestId( 'appender-button' )
			).toBeTruthy();
		} );

		describe( 'when a non-last block is selected', () => {
			beforeEach( async () => {
				// Arrange
				await initializeEditor();
				await addBlock( screen, 'Group' );
				const groupBlock = await getBlock( screen, 'Group' );
				fireEvent.press(
					within( groupBlock ).getByTestId( 'appender-button' )
				);
				await addBlock( screen, 'Paragraph', { isPickerOpened: true } );
				fireEvent.press( screen.getByLabelText( 'Navigate Up' ) );
				fireEvent.press(
					within( groupBlock ).getByTestId( 'appender-button' )
				);
				await addBlock( screen, 'Paragraph', { isPickerOpened: true } );
			} );

			it( 'renders an insertion point before the block', async () => {
				// Act
				const paragraphBlock = await getBlock( screen, 'Paragraph', {
					rowIndex: 1,
				} );
				fireEvent.press( paragraphBlock );
				fireEvent( screen.getByLabelText( 'Add block' ), 'longPress' );
				fireEvent.press( screen.getByText( 'Add Block Before' ) );

				// Assert
				expect( screen.getByText( 'ADD BLOCK HERE' ) ).toBeTruthy();
				expect(
					screen.getByTestId( 'block-insertion-point-before-row-1' )
				).toBeTruthy();
			} );

			it( 'renders an insertion point after the block', async () => {
				// Act
				const paragraphBlock = await getBlock( screen, 'Paragraph', {
					rowIndex: 1,
				} );
				fireEvent.press( paragraphBlock );
				fireEvent( screen.getByLabelText( 'Add block' ), 'longPress' );
				fireEvent.press( screen.getByText( 'Add Block After' ) );

				// Assert
				expect( screen.getByText( 'ADD BLOCK HERE' ) ).toBeTruthy();
				expect(
					screen.getByTestId( 'block-insertion-point-before-row-2' )
				).toBeTruthy();
			} );
		} );

		describe( 'when the last block is selected', () => {
			it( 'renders an insertion point before the block', async () => {
				// Arrange
				await initializeEditor();
				await addBlock( screen, 'Group' );
				const groupBlock = await getBlock( screen, 'Group' );
				fireEvent.press(
					within( groupBlock ).getByTestId( 'appender-button' )
				);
				await addBlock( screen, 'Paragraph', { isPickerOpened: true } );
				fireEvent.press( screen.getByLabelText( 'Navigate Up' ) );
				fireEvent.press(
					within( groupBlock ).getByTestId( 'appender-button' )
				);
				await addBlock( screen, 'Paragraph', { isPickerOpened: true } );

				// Act
				const paragraphBlock = await getBlock( screen, 'Paragraph', {
					rowIndex: 2,
				} );
				fireEvent.press( paragraphBlock );
				fireEvent( screen.getByLabelText( 'Add block' ), 'longPress' );
				fireEvent.press( screen.getByText( 'Add Block Before' ) );

				// Assert
				expect( screen.getByText( 'ADD BLOCK HERE' ) ).toBeTruthy();
				expect(
					screen.getByTestId( 'block-insertion-point-before-row-2' )
				).toBeTruthy();
			} );

			it( 'renders an insertion point after the block', async () => {
				// Arrange
				await initializeEditor();
				await addBlock( screen, 'Group' );
				const groupBlock = await getBlock( screen, 'Group' );
				fireEvent.press(
					within( groupBlock ).getByTestId( 'appender-button' )
				);
				await addBlock( screen, 'Paragraph', { isPickerOpened: true } );
				fireEvent.press( screen.getByLabelText( 'Navigate Up' ) );
				fireEvent.press(
					within( groupBlock ).getByTestId( 'appender-button' )
				);
				await addBlock( screen, 'Paragraph', { isPickerOpened: true } );

				// Act
				const paragraphBlock = await getBlock( screen, 'Paragraph', {
					rowIndex: 2,
				} );
				fireEvent.press( paragraphBlock );
				fireEvent( screen.getByLabelText( 'Add block' ), 'longPress' );
				fireEvent.press( screen.getByText( 'Add Block After' ) );

				// Assert
				expect( screen.getByText( 'ADD BLOCK HERE' ) ).toBeTruthy();
				expect(
					screen.getByTestId( 'block-insertion-point-after-row-2' )
				).toBeTruthy();
			} );
		} );
	} );
} );
