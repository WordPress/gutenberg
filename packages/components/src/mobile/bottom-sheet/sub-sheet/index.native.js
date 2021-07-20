/**
 * External dependencies
 */
import { SafeAreaView } from 'react-native';

/**
 * WordPress dependencies
 */
import { Children, useEffect } from '@wordpress/element';
import { createSlotFill, BottomSheetConsumer } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'BottomSheetSubSheet' );

const BottomSheetSubSheet = ( {
	children,
	navigationButton,
	showSheet,
	isFullScreen,
} ) => {
	const BottomSheetScreen = ( { onMount } ) => {
		useEffect( onMount, [] );
		return children ?? null;
	};

	return (
		<>
			{ showSheet && (
				<Fill>
					<SafeAreaView>
						<BottomSheetConsumer>
							{ ( { setIsFullScreen } ) => (
								<BottomSheetScreen
									onMount={ () =>
										setIsFullScreen( isFullScreen )
									}
								/>
							) }
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
