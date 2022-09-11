/**
 * External dependencies
 */
import { TextInput } from 'react-native';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { forwardRef, useImperativeHandle, useRef } from '@wordpress/element';

// Preserve the mock of AztecInputState to be exported with the AztecView mock.
const AztecInputState = jest.requireActual( '@wordpress/react-native-aztec' )
	.default.InputState;

const UNSUPPORTED_PROPS = [ 'style' ];

const RCTAztecView = ( { accessibilityLabel, text, ...rest }, ref ) => {
	const inputRef = useRef();

	useImperativeHandle( ref, () => ( {
		// We need to reference the props of TextInput because they are used in TextColorEdit to calculate the color indicator.
		// Reference: https://github.com/WordPress/gutenberg/blob/4407ae6fa20bdd3c3aa62d50344e796467359246/packages/format-library/src/text-color/index.native.js#L83-L86
		props: { ...inputRef.current.props },
		blur: () => {
			AztecInputState.blur( inputRef.current );
			inputRef.current.blur();
		},
		focus: () => {
			AztecInputState.focus( inputRef.current );
			inputRef.current.focus();
		},
		isFocused: () => {
			const focusedElement = AztecInputState.getCurrentFocusedElement();
			return focusedElement && focusedElement === inputRef.current;
		},
	} ) );

	return (
		<TextInput
			{ ...omit( rest, UNSUPPORTED_PROPS ) }
			accessibilityLabel={
				accessibilityLabel || `Text input. ${ text.text || 'Empty' }`
			}
			ref={ inputRef }
			value={ text.text }
		/>
	);
};

const AztecView = forwardRef( RCTAztecView );
AztecView.InputState = AztecInputState;

export default AztecView;
