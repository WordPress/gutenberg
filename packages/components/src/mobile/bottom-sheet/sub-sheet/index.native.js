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

const BottomSheetSubSheet = ( {
	children,
	navigationButton,
	showSheet,
	isFullScreen,
} ) => {
	return (
		<>
			{ showSheet && (
				<Fill>
					<SafeAreaView>
						<BottomSheetConsumer>
							{ ( { setIsFullScreen } ) => {
								setIsFullScreen( isFullScreen );
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
