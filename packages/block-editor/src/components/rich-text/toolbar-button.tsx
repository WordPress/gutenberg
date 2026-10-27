import { Fill, ToolbarButton } from '@wordpress/components';
import { displayShortcut } from '@wordpress/keycodes';
import type { ComponentProps } from 'react';
import type {
	PrivateRichTextToolbarButtonProps,
	RichTextToolbarButtonProps,
} from './types';

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

// The format toolbar reads `order` from this element's props to sort the
// "More" dropdown, so it isn't passed on to the button.
export function OrderedToolbarButton( {
	order,
	...props
}: ComponentProps< typeof ToolbarButton > & { order: number } ) {
	return <ToolbarButton { ...props } />;
}

/**
 * Adds a button to the "More" dropdown, listed by `order`. The buttons of
 * `RichTextToolbarButton` come after these, in the order they were rendered.
 */
export function PrivateRichTextToolbarButton( {
	order,
	shortcutType,
	shortcutCharacter,
	...props
}: PrivateRichTextToolbarButtonProps ) {
	let shortcut: string | undefined;

	if ( shortcutType && shortcutCharacter ) {
		shortcut = displayShortcut[ shortcutType ]( shortcutCharacter );
	}

	return (
		<Fill name="RichText.ToolbarControls">
			<OrderedToolbarButton
				{ ...props }
				order={ order }
				shortcut={ shortcut }
			/>
		</Fill>
	);
}
