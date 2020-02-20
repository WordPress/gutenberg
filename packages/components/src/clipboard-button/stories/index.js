/**
 * External dependencies
 */
import { boolean, text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ClipboardButton from '../';

export default {
	title: 'Components/ClipboardButton',
	component: ClipboardButton,
};

const ClipboardButtonWithState = ( { copied, ...props } ) => {
	const [ isCopied, setCopied ] = useState( copied );

	return (
		<ClipboardButton
			{ ...props }
			onCopy={ () => setCopied( true ) }
			onFinishCopy={ () => setCopied( false ) }
		>
			{ isCopied ? 'Copied!' : `Copy "${ props.text }"` }
		</ClipboardButton>
	);
};

export const _default = () => {
	const isPrimary = boolean( 'Is primary', true );
	const copyText = text( 'Text', 'Text' );

	return (
		<ClipboardButtonWithState isPrimary={ isPrimary } text={ copyText } />
	);
};
