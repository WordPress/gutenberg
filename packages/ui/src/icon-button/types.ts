import { type ButtonProps } from '../button/types';
import { type IconProps } from '../icon/types';

export type IconButtonProps = Omit< ButtonProps, 'children' > & {
	/**
	 * A label describing the button's action, shown as a tooltip and to
	 * assistive technology.
	 */
	label: string;

	/**
	 * The icon to display in the button.
	 */
	icon: IconProps[ 'icon' ];

	/**
	 * The keyboard shortcut associated with this button. When provided, the
	 * shortcut is displayed in the tooltip and announced to assistive technology.
	 *
	 * **Note**: This prop is for display and accessibility purposes only — the
	 * consumer is responsible for implementing the actual keyboard event handler.
	 */
	shortcut?: {
		/**
		 * The human-readable representation of the shortcut, displayed in the
		 * tooltip. Use platform-appropriate symbols (e.g., "⌘S" on macOS,
		 * "Ctrl+S" on Windows).
		 */
		displayShortcut: string;
		/**
		 * The shortcut in a format compatible with the
		 * [aria-keyshortcuts](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-keyshortcuts)
		 * attribute. Use "+" to separate keys and standard key names
		 * (e.g., "Meta+S", "Control+Shift+P").
		 */
		ariaKeyShortcut: string;
	};
};
