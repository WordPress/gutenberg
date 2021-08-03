/**
 * External dependencies
 */
import { SafeAreaView } from 'react-native';

/**
 * WordPress dependencies
 */
import { Children, useEffect, useContext } from '@wordpress/element';
import {
	createSlotFill,
	BottomSheetConsumer,
	BottomSheetContext,
} from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'BottomSheetSubSheet' );

const BottomSheetSubSheet = ( {
	children,
	navigationButton,
	showSheet,
	isFullScreen,
} ) => {
	const { setIsFullScreen } = useContext( BottomSheetContext );

	useEffect( () => {
		if ( showSheet ) {
			setIsFullScreen( isFullScreen );
		}
	}, [ showSheet, isFullScreen ] );

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
