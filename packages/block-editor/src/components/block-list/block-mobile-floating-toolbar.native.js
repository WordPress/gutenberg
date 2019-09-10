/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './block-mobile-floating-toolbar.scss';

function FloatingToolbar( { children } ) {
	return (
		<View
			style={ styles.floatingToolbarContainer }
		>
			<View
				style={ styles.floatingToolbarFill }
			>{ children }
			</View>
		</View>
	);
}

export default FloatingToolbar;

