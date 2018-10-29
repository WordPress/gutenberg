/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

export default function NextPageEdit( { attributes } ) {
	const { customText } = attributes;
	const defaultText = __( 'Page break' );
	const value = customText !== undefined ? customText : defaultText;

	return (
		<View className={ styles[ 'block-library-nextpage__container' ] }>
			<Text>{ value }</Text>
		</View>
	);
}
