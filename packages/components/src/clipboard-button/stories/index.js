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
	const [ copied, setCopied ] = useState( false );
	return (
		<ClipboardButton
			isPrimary
			text="Text"
			onCopy={ () => setCopied( true ) }
			onFinishCopy={ () => setCopied( false ) }
		>
			{ copied ? 'Copied!' : 'Copy "Text"' }
		</ClipboardButton>
	);
};
