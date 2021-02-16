/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */

export default function TextButton( { value, placeholder, onChange } ) {
	const onTextChanged = ( html ) => {
		onChange( html );
	};

	return (
		<View>
			<RichText
				placeholder={ placeholder }
				value={ value }
				identifier="text"
				withoutInteractiveFormatting
				onChange={ onTextChanged }
				textAlign="center"
				minWidth={ 100 }
			/>
		</View>
	);
}
