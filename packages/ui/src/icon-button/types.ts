import { type ButtonProps } from '../button/types';
import { type IconProps } from '../icon/types';
import { type PopupProps as TooltipPopupProps } from '../tooltip/types';
import type { KeyboardShortcut } from '../utils/keyboard-shortcut';

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
	 * consumer is responsible for registering the keyboard shortcut and keeping
	 * its handler synchronized with the button's disabled state.
	 */
	shortcut?: KeyboardShortcut;

	/**
	 * Customize how the tooltip is positioned relative to the button. Accepts
	 * a `<Tooltip.Positioner />` element with custom positioning props
	 * (`side`, `align`, `sideOffset`, collision settings, etc.). When omitted,
	 * the tooltip uses the default placement.
	 */
	positioner?: TooltipPopupProps[ 'positioner' ];
};
