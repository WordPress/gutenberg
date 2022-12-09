/**
 * WordPress dependencies
 */
import { TextControl } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { useLinkControlContext } from '.';

const LinkControlTextInput = forwardRef( ( _props, ref ) => {
	const {
		showTextControl,
		internalTextInputValue,
		setInternalTextInputValue,
		handleSubmit,
		currentInputIsEmpty,
	} = useLinkControlContext();

	if ( ! showTextControl ) {
		return null;
	}

	const handleSubmitWithEnter = ( event ) => {
		const { keyCode } = event;
		if (
			keyCode === ENTER &&
			! currentInputIsEmpty // Disallow submitting empty values.
		) {
			event.preventDefault();
			handleSubmit();
		}
	};

	return (
		<TextControl
			ref={ ref }
			className="block-editor-link-control__field block-editor-link-control__text-content"
			label="Text"
			value={ internalTextInputValue }
			onChange={ setInternalTextInputValue }
			onKeyDown={ handleSubmitWithEnter }
		/>
	);
} );

export default LinkControlTextInput;
