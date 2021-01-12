/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default function FocalPointPicker( props ) {
	return (
		<View>
			<Text>{ __( 'Focal Point Picker' ) }</Text>
		</View>
	);
}
