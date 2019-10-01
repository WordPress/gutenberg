/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './block-mobile-floating-toolbar.scss';
/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'FloatingToolbar' );

function FloatingToolbar( { children } ) {
	return (
		<Fill>
			{ ( { innerFloatingToolbar } ) => {
				return (
					<TouchableWithoutFeedback>
						<View
						// Issue: `FloatingToolbar` placed above the first item in group is not touchable on Android.
						// Temporary solution: Use `innerFloatingToolbar` to place `FloatingToolbar` over the first item in group.
						// TODO: `{ top: innerFloatingToolbar ? 0 : -44 }` along with `innerFloatingToolbar` should be removed once issue is fixed.
							style={ [ styles.floatingToolbarFill, { top: innerFloatingToolbar ? 0 : -44 } ] }
						>{ children }
						</View>
					</TouchableWithoutFeedback>
				);
			} }

		</Fill>
	);
}

FloatingToolbar.Slot = Slot;

export default FloatingToolbar;
