/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { Fill } from '@wordpress/slot-fill';
import { displayShortcut } from '@wordpress/keycodes';

export function RichTextToolbarButton( {
	name,
	shortcutType,
	shortcutCharacter,
	...props
} ) {
	let shortcut;
	let fillName = 'RichText.ToolbarControls';

	if ( name ) {
		fillName += `.${ name }`;
	}

	if ( shortcutType && shortcutCharacter ) {
		shortcut = displayShortcut[ shortcutType ]( shortcutCharacter );
	}

	return (
		<Fill name={ fillName }>
			<ToolbarButton { ...props } shortcut={ shortcut } />
		</Fill>
	);
}
