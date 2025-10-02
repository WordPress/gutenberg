/**
 * External dependencies
 */
import {
	initializeEditor,
	setupCoreBlocks,
	fireEvent,
	within,
} from 'test/helpers';

setupCoreBlocks();

describe( 'Pullquote', () => {
	it( 'should not be present in inserter modal', async () => {
		// Arrange
		const screen = await initializeEditor();

		fireEvent.press( screen.getByLabelText( 'Add block' ) );

		const inserterModal = screen.getByTestId( 'InserterUI-Blocks' );
		// onScroll event used to force the FlatList to render all items
		fireEvent.scroll( inserterModal, {
			nativeEvent: {
				contentOffset: { y: 0, x: 0 },
				contentSize: { width: 100, height: 100 },
				layoutMeasurement: { width: 100, height: 100 },
			},
		} );

		expect(
			await within( inserterModal ).queryByText( 'Pullquote' )
		).toBeNull();
	} );
} );
