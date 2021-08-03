/**
 * External dependencies
 */
import { SafeAreaView } from 'react-native';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { createSlotFill, BottomSheetConsumer } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'BottomSheetSubSheet' );

const BottomSheetSubSheet = ( { children, navigationButton, showSheet } ) => {

	return (
		<>
			{ showSheet && (
				<Fill>
					<SafeAreaView>
						<BottomSheetConsumer>
							{ () => {
								return children;
							} }
						</BottomSheetConsumer>
					</SafeAreaView>
				</Fill>
			) }
			{ Children.count( children ) > 0 && navigationButton }
		</>
	);
};

BottomSheetSubSheet.Slot = Slot;
BottomSheetSubSheet.screenName = 'BottomSheetSubSheet';

export default BottomSheetSubSheet;
