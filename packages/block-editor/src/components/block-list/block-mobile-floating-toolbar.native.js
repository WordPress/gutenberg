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
			<TouchableWithoutFeedback>
				<View
					style={ styles.floatingToolbarContainer }
				>
					<View
						style={ styles.floatingToolbarFill }
					>{ children }
					</View>
				</View>
			</TouchableWithoutFeedback>
		</Fill>
	);
}

FloatingToolbar.Slot = Slot;

export default FloatingToolbar;
