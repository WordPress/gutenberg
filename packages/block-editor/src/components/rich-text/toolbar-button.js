/**
 * WordPress dependencies
 */
import { Fill, ToolbarButton } from '@wordpress/components';
import { displayShortcut } from '@wordpress/keycodes';
import { useRef } from '@wordpress/element';

export function RichTextToolbarButton( {
	name,
	shortcutType,
	shortcutCharacter,
	onClick,
	...props
} ) {
	const activeElement = useRef( null );

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
			<ToolbarButton
				{ ...props }
				shortcut={ shortcut }
				extraProps={ {
					onMouseDown: () => {
						activeElement.current = document.activeElement;
					},
				} }
				onClick={ () => {
					onClick( ...arguments );

					if ( activeElement.current ) {
						activeElement.current.focus();
						activeElement.current = null;
					}
				} }
			/>
		</Fill>
	);
}
