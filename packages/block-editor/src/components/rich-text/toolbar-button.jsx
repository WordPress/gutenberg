import { Fill, ToolbarButton } from '@wordpress/components';
import { displayShortcut } from '@wordpress/keycodes';
import { isBlockToolbarRedesign } from '../block-toolbar/redesign/utils';

/**
 * A button for the rich text toolbar.
 *
 * @param {Object} props                   Component props.
 * @param {string} props.name              Name of a fixed slot for the button
 *                                         (bold, italic, link). Leave empty
 *                                         for the shared slot.
 * @param {string} props.group             What the button does to the text:
 *                                         `format` (the default) formats it,
 *                                         `insert` adds something inline
 *                                         (an image, a footnote). With the
 *                                         block toolbar redesign, insert
 *                                         buttons move to the block options
 *                                         menu.
 * @param {string} props.shortcutType      Modifier for the shortcut.
 * @param {string} props.shortcutCharacter Character for the shortcut.
 */
export function RichTextToolbarButton( {
	name,
	group,
	shortcutType,
	shortcutCharacter,
	...props
} ) {
	let shortcut;
	let fillName = 'RichText.ToolbarControls';

	if ( name ) {
		fillName += `.${ name }`;
	} else if ( group === 'insert' && isBlockToolbarRedesign() ) {
		fillName += '.insert';
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
