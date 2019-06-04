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
			{
				props.children.map( ( child, index ) => {
					return ( child && <View key={ 'spacer_' + index } style={ index !== 0 && styles.wpBlockQuoteSpacer }>{ child }</View> );
				} )
			}
		</View>
	);
};
