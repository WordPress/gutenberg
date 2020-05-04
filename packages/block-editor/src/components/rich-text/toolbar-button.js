/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fill, ToolbarButton, Button } from '@wordpress/components';
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

	if ( name ) {
		return (
			<Fill name={ fillName }>
				<ToolbarButton { ...props } shortcut={ shortcut } />
			</Fill>
		);
	}

	return (
		<Fill name={ fillName }>
			{ ( { onClose } ) => (
				<Button
					className="block-editor-rich-text__advanced-toolbar-button"
					role="menuitem"
					{ ...omit( props, [ 'title', 'onClick' ] ) }
					onClick={ ( event ) => {
						if ( props.onClick ) {
							props.onClick( event );
						}
						onClose();
					} }
				>
					{ props.title }
				</Button>
			) }
		</Fill>
	);
}
