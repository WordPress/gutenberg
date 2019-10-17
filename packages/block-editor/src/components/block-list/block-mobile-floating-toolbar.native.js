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
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { createSlotFill } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'FloatingToolbar' );

const FloatingToolbarFill = ( { children, getStylesFromColorScheme } ) => {
	return (
		<Fill>
			{ ( { innerFloatingToolbar } ) => {
				const fillStyle = getStylesFromColorScheme( styles.floatingToolbarFillColor, styles.floatingToolbarFillColorDark );
				return (
					<TouchableWithoutFeedback>
						<View
						// Issue: `FloatingToolbar` placed above the first item in group is not touchable on Android.
						// Temporary solution: Use `innerFloatingToolbar` to place `FloatingToolbar` over the first item in group.
						// TODO: `{ top: innerFloatingToolbar ? 0 : -44 }` along with `innerFloatingToolbar` should be removed once issue is fixed.
							style={ [ fillStyle, styles.floatingToolbarFill, { top: innerFloatingToolbar ? 0 : -44 } ] }
						>{ children }
						</View>
					</TouchableWithoutFeedback>
				);
			} }

		</Fill>
	);
};

const FloatingToolbar = compose( withPreferredColorScheme )( FloatingToolbarFill );
FloatingToolbar.Slot = Slot;

export default FloatingToolbar;
