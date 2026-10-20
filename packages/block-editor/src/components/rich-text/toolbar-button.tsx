import { Fill, ToolbarButton } from '@wordpress/components';
import { displayShortcut } from '@wordpress/keycodes';
import type { RichTextToolbarButtonProps } from './types';

export function RichTextToolbarButton( {
	name,
	shortcutType,
	shortcutCharacter,
	...props
}: RichTextToolbarButtonProps ) {
	let shortcut: string | undefined;
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
