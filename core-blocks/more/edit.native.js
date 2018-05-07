/** @format */

import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PlainText } from '@wordpress/editor';
import styles from './editor.scss';

export default function edit( { attributes, setAttributes } ) {
	const { customText } = attributes;
	const defaultText = __( 'Read more' );
	const value = customText !== undefined ? customText : defaultText;

	return (
		<View className={ styles[ 'blocks-more-container' ] }>
			<View className={ styles[ 'blocks-more-sub-container' ] }>
				<Text className={ styles[ 'blocks-more-left-marker' ] }>&lt;!--</Text>
				<PlainText
					className={ styles[ 'blocks-more-plain-text' ] }
					value={ value }
					multiline={ true }
					underlineColorAndroid="transparent"
					onChange={ ( newValue ) => setAttributes( { customText: newValue } ) }
					placeholder={ defaultText }
				/>
				<Text className={ styles[ 'blocks-more-right-marker' ] }>--&gt;</Text>
			</View>
		</View> );
}
