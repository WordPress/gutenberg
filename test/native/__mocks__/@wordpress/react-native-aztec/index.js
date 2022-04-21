/**
 * External dependencies
 */
import { TextInput } from 'react-native';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

const reactNativeAztecMock = jest.createMockFromModule(
	'@wordpress/react-native-aztec'
);
// Preserve the mock of AztecInputState to be exported with the AztecView mock.
const AztecInputState = reactNativeAztecMock.default.InputState;

const UNSUPPORTED_PROPS = [ 'style' ];

const AztecView = ( { accessibilityLabel, text, ...rest }, ref ) => {
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

// Replace default mock of AztecView component with custom implementation.
reactNativeAztecMock.default = forwardRef( AztecView );
reactNativeAztecMock.default.InputState = AztecInputState;

module.exports = reactNativeAztecMock;
