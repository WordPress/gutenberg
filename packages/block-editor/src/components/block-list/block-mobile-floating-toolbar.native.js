/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './block-mobile-floating-toolbar.scss';

const FloatingToolbar = ( { children, isFirstBlock } ) => {
	return (
		<TouchableWithoutFeedback accessible={ false }>
			<View
				style={ [
					styles.floatingToolbar,
					isFirstBlock && styles.withMargin,
				] }
			>
				{ children }
			</View>
		</TouchableWithoutFeedback>
	);
};

export default FloatingToolbar;
