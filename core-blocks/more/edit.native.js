/** @format */

import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '../../../i18n';

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
		<View className={ styles.blocks_more_container }>
			<View className={ styles.blocks_more_sub_container }>
				<Text className={ styles.blocks_more_left_marker }>&lt;!--</Text>
				<PlainText
					className={ styles.blocks_more_plain_text }
					value={ value }
					multiline={ true }
					underlineColorAndroid="transparent"
					onChange={ value => setAttributes( { customText: value } ) }
					placeholder={ defaultText }
				/>
				<Text className={ styles.blocks_more_right_marker }>--&gt;</Text>
			</View>
		</View> );
}
