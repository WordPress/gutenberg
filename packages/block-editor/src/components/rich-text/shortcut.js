/**
 * WordPress dependencies
 */
import { useKeyboardShortcut } from '@wordpress/compose';
import { rawShortcut } from '@wordpress/keycodes';

export function RichTextShortcut( { character, type, onUse } ) {
	const callback = () => {
		onUse();
		return false;
	};
	useKeyboardShortcut( rawShortcut[ type ]( character ), callback, {
		bindGlobal: true,
	} );

	return null;
}
