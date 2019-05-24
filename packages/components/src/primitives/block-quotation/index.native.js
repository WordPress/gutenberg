/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * Internal dependencies
 */
import styles from './style.scss';

export const BlockQuotation = ( props ) => {
	return (
		<View style={ styles.wpBlockQuote } >
			{ props.children }
		</View>
	);
};
