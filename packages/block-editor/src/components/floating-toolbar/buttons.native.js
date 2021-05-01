/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';
import { createSlotFill, Toolbar } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const { Fill, Slot } = createSlotFill( 'FloatingToolbarButtons' );

const FloatingToolbarButtons = ( { children } ) => (
	<Fill>
		<Toolbar passedStyle={ styles.toolbarButtons }>
			{ Children.count( children ) > 0 && (
				<View style={ styles.pipeButtons } />
			) }
			{ children }
		</Toolbar>
	</Fill>
);

FloatingToolbarButtons.Slot = Slot;

export default FloatingToolbarButtons;
