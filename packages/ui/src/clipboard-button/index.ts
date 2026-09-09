import { ClipboardButton as _ClipboardButton } from './clipboard-button';
import { ClipboardButtonIcon } from './icon';
import { ClipboardButtonLabel } from './label';

ClipboardButtonIcon.displayName = 'ClipboardButton.Icon';
ClipboardButtonLabel.displayName = 'ClipboardButton.Label';

/**
 * A button that copies text to the clipboard. Inherits `Button` props, including
 * `tone` and `variant`. Compose `ClipboardButton.Icon`, `ClipboardButton.Label`,
 * or both as children.
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
 * 			<ClipboardButton.Label />
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
	/**
	 * A text label that follows copy status. Render it inside `ClipboardButton`,
	 * alone or alongside `ClipboardButton.Icon`.
	 */
	Label: ClipboardButtonLabel,
} );
