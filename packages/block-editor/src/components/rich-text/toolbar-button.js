import { Fill, ToolbarButton } from '@wordpress/components';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * RichTextToolbarButton component displays a button in the rich text toolbar.
 *
 * @param {Object} props                   The component props.
 * @param {string} props.name              Name of the button.
 * @param {string} props.shortcutType      Type of the shortcut.
 * @param {string} props.shortcutCharacter Character of the shortcut.
 * @param {Object} props.props             Props to pass to the `ToolbarButton` component.
 *
 * @return {Element} The toolbar button element.
 *
 * @example
 * ```jsx
 * function MyRichTextToolbarButton() {
 * 	return (
 * 		<RichTextToolbarButton
 * 			name="my-button"
 * 			icon={ icon }
 * 			title="My button"
 * 			onClick={ () => {
 * 				console.log( 'Button clicked!' );
 * 			}
 *         shortCutType="primary"
 *         shortCutCharacter="b"
 * 		/>
 * );
 * }
 * ```
 */
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
