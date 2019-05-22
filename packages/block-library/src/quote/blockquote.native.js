/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * Internal dependencies
 */
import styles from './style';

export const Blockquote = ( props ) => {
	return (
		<View style={ { flex: 1, flexDirection: 'row', alignItems: 'stretch' } } >
			<View style={ styles.wpBlockQuoteMargin } />
			<View style={ styles.wpBlockQuoteComponents } >
				{ props.children }
			</View>
		</View>
	);
};
