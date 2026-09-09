import { ClipboardButton as _ClipboardButton } from './clipboard-button';
import { ClipboardButtonIcon } from './icon';

ClipboardButtonIcon.displayName = 'ClipboardButton.Icon';

/**
 * A button that copies text to the clipboard. Inherits `Button` props, including
 * `tone` and `variant`. Compose `ClipboardButton.Icon`, text, or both as
 * children.
 *
 * When rendering a group of `ClipboardButton`s, wrap them in a
 * `Tooltip.Provider` to coordinate tooltip delays across the group.
 *
 * ```jsx
 * import { ClipboardButton } from '@wordpress/ui';
 *
 * function MyClipboardButton() {
 * 	return (
 * 		<ClipboardButton text="Text to copy">
 * 			<ClipboardButton.Icon />
 * 			Copy
 * 		</ClipboardButton>
 * 	);
 * }
 * ```
 */
export const ClipboardButton = Object.assign( _ClipboardButton, {
	/**
	 * An icon that follows copy status. Render it inside `ClipboardButton`,
	 * alone or alongside a text label.
	 */
	Icon: ClipboardButtonIcon,
} );
