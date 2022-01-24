/**
 * External dependencies
 */
import { TextInput } from 'react-native';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

const UNSUPPORTED_PROPS = [ 'style' ];

const RCTAztecView = ( { accessibilityLabel, text, ...rest }, ref ) => {
	return (
		<TextInput
			{ ...omit( rest, UNSUPPORTED_PROPS ) }
			accessibilityLabel={
				accessibilityLabel || `Text input. ${ text.text || 'Empty' }`
			}
			ref={ ref }
			value={ text.text }
		/>
	);
};

export default forwardRef( RCTAztecView );
