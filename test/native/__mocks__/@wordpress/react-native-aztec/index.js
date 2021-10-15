/**
 * External dependencies
 */
import { TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

const RCTAztecView = ( { accessibilityLabel, text, ...rest }, ref ) => {
	return (
		<TextInput
			{ ...rest }
			accessibilityLabel={
				accessibilityLabel || `Text input. ${ text.text || 'Empty' }`
			}
			ref={ ref }
			value={ text.text }
		/>
	);
};

export default forwardRef( RCTAztecView );
