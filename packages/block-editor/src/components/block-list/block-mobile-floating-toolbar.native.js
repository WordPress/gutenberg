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
			<TouchableWithoutFeedback onPress={ () => {
				console.warn( 'WORK' ); //eslint-disable-line no-console
			} }>
				<View
					style={ styles.floatingToolbarFill }
				>{ children }
				</View>
			</TouchableWithoutFeedback>
		</Fill>
	);
}

FloatingToolbar.Slot = Slot;

export default FloatingToolbar;
