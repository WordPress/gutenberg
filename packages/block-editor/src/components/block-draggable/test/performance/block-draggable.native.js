/**
 * External dependencies
 */
import { Text, View } from 'react-native';
import { measurePerformance, screen } from 'test/helpers';
/**
 * Internal dependencies
 */
import { fireLongPress } from '../helpers';

/**
 * Internal dependencies
 */
import BlockDraggable from '../../index.native';

describe( 'Block Draggable Performance', () => {
	const onLongPress = jest.fn();

	it( 'performance is stable when dragging block', async () => {
		const scenario = async () => {
			const draggable = screen.getByTestId( 'draggable-test' );

			fireLongPress( draggable, 'draggable-test-child-view' );
		};

		await measurePerformance(
			<View testID="container">
				<View />
				<BlockDraggable
					clientId="clientId"
					draggingClientId="clientId"
					enabled={ true }
					onLongPress={ onLongPress }
					testID="draggable-test"
				>
					{ () => (
						<View testID="draggable-test-child-view">
							<Text>Block Draggable</Text>
						</View>
					) }
				</BlockDraggable>
			</View>,
			{
				scenario,
			}
		);
	} );
} );
