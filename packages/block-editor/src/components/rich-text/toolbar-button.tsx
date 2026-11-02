import { Fill, ToolbarButton } from '@wordpress/components';
import { displayShortcut } from '@wordpress/keycodes';
import type { ComponentProps } from 'react';
import { TOOLBAR_FORMATS } from './format-toolbar/formats';
import type { RichTextToolbarButtonProps } from './types';

// We need the `RichText.ToolbarControls` slot handler to identify core fills
// by their `name` props, even though `name` isn't propagated to the actually
// rendered elements.
function NamedToolbarButton( {
	name,
	...props
}: ComponentProps< typeof ToolbarButton > & { name?: string } ) {
	return <ToolbarButton { ...props } />;
}

export function RichTextToolbarButton( {
	name,
	shortcutType,
	shortcutCharacter,
	...props
}: RichTextToolbarButtonProps ) {
	let shortcut: string | undefined;
	let fillName = 'RichText.ToolbarControls';

	// Only the formats shown as their own button in the toolbar have a slot of
	// their own. Other formats go in the "More" dropdown.
	if ( name && TOOLBAR_FORMATS.includes( name ) ) {
		fillName += `.${ name }`;
	}

	if ( shortcutType && shortcutCharacter ) {
		shortcut = displayShortcut[ shortcutType ]( shortcutCharacter );
	}

	return (
		<Fill name={ fillName }>
			<NamedToolbarButton
				{ ...props }
				name={ name }
				shortcut={ shortcut }
			/>
		</Fill>
	);
}
