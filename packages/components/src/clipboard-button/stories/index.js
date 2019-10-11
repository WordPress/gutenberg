/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ClipboardButton from '../';

export default { title: 'Clipboard Button', component: ClipboardButton };

export const _default = () => {
	const [ hasCopied, setState ] = useState( false );

	return (
		<ClipboardButton
			isPrimary
			text="Text to be copied."
			onCopy={ () => setState( true ) }
			onFinishCopy={ () => setState( false ) }
		>
			{ hasCopied ? 'Copied!' : 'Copy Text' }
		</ClipboardButton>
	);
};
