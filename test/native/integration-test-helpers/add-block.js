/**
 * External dependencies
 */
import { fireEvent, within } from '@testing-library/react-native';

/**
 * Internal dependencies
 */
import { waitFor } from './wait-for';

/**
 * Adds a block via the block picker.
 *
 * @param {import('@testing-library/react-native').RenderAPI} screen    A Testing Library screen.
 * @param {string}                                            blockName Name of the block to be inserted as shown in the block picker.
 * @param {container}                                         container Containing element in which to add a block, defaults to top-level.
 */
export const addBlock = async ( screen, blockName, container ) => {
	const { getByA11yLabel, getByTestId, getByText } = screen;

	let blockAppender;
	if ( container ) {
		blockAppender = within( container ).getByTestId( 'appender-button' );
	} else {
		blockAppender = getByA11yLabel( 'Add block' );
	}

	fireEvent.press( blockAppender );

	const blockList = getByTestId( 'InserterUI-Blocks' );
	// onScroll event used to force the FlatList to render all items
	fireEvent.scroll( blockList, {
		nativeEvent: {
			contentOffset: { y: 0, x: 0 },
			contentSize: { width: 100, height: 100 },
			layoutMeasurement: { width: 100, height: 100 },
		},
	} );

	fireEvent.press( await waitFor( () => getByText( blockName ) ) );
};
