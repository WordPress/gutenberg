/** @format */

import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PlainText from '../../plain-text';
import styles from './editor.scss';

export function edit( { attributes, setAttributes, isSelected } ) {
	const { customText, noTeaser } = attributes;
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
					onChange={ value => setAttributes( { customText: value } ) }
					placeholder={ defaultText }
				/>
				<Text className={ styles[ 'blocks-more-right-marker' ] }>--&gt;</Text>
			</View>
		</View> );
}
