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

setupCoreBlocks( [ 'core/paragraph', 'core/group' ] );

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
			// Assert
			expect(
				screen.getByPlaceholderText( /Start writing/ )
			).toBeTruthy();
		} );

		it( 'renders an end-of-list paragraph appender', async () => {
			// Assert
			expect(
				screen.getByLabelText( 'Add paragraph block' )
			).toBeTruthy();
		} );
	} );

	describe( 'for inner blocks', () => {
		it( 'renders an inner block appender', async () => {
			await initializeEditor();
			await addBlock( screen, 'Group' );
			const groupBlock = await getBlock( screen, 'Group' );
			triggerBlockListLayout( groupBlock );

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
