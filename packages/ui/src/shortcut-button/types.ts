import type { ButtonProps } from '../button/types';
import type { PopupProps as TooltipPopupProps } from '../tooltip/types';
import type { KeyboardShortcut } from '../utils/keyboard-shortcut';

export interface ShortcutButtonProps
	extends Omit< ButtonProps, 'aria-keyshortcuts' > {
	/**
	 * The keyboard shortcut associated with this button. Its display value is
	 * shown in the tooltip, and its label is used in an accessible description.
	 *
	 * This prop is for display and accessibility purposes only. The consumer is
	 * responsible for registering the keyboard shortcut and keeping its handler
	 * synchronized with the button's disabled state.
	 */
	shortcut: KeyboardShortcut;

	/**
	 * Customize how the tooltip is positioned relative to the button. Accepts
	 * a `<Tooltip.Positioner />` element with custom positioning props
	 * (`side`, `align`, `sideOffset`, collision settings, etc.). When omitted,
	 * the tooltip uses the default placement.
	 */
	positioner?: TooltipPopupProps[ 'positioner' ];
}
