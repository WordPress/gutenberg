/**
 * External dependencies
 */
import { SafeAreaView } from 'react-native';

/**
 * WordPress dependencies
 */
import { Children, useEffect, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BottomSheetContext } from '../bottom-sheet-context';
import { createSlotFill } from '../../../slot-fill';

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
		// Disable reason: deferring this refactor to the native team.
		// see https://github.com/WordPress/gutenberg/pull/41166
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ showSheet, isFullScreen ] );

	return (
		<>
			{ showSheet && (
				<Fill>
					<SafeAreaView>{ children }</SafeAreaView>
				</Fill>
			) }
			{ Children.count( children ) > 0 && navigationButton }
		</>
	);
};

BottomSheetSubSheet.Slot = Slot;
BottomSheetSubSheet.screenName = 'BottomSheetSubSheet';

export default BottomSheetSubSheet;
