import type { ButtonProps } from '../button/types';
import type { CopyToClipboardOnCopy } from '../copy-to-clipboard/types';
import type { IconProps } from '../icon/types';
import type { PopupProps as TooltipPopupProps } from '../tooltip/types';

export type ClipboardButtonProps = Omit< ButtonProps, 'onCopy' > & {
	/**
	 * The text to copy. Use a function if the value is not already available
	 * and is expensive to compute.
	 */
	text: string | ( () => string );

	/**
	 * Time in milliseconds before the copied status returns to pending.
	 *
	 * @default 1000
	 */
	timeout?: number;

	/**
	 * Called after a successful copy with the copied text. The second argument
	 * is always `true`.
	 */
	onCopy?: CopyToClipboardOnCopy;

	/**
	 * Whether to show a tooltip with the copy and copied labels.
	 *
	 * @default true
	 */
	hasTooltip?: boolean;

	/**
	 * Label shown in the tooltip before copying. Also used as the accessible
	 * name when the button has no visible text.
	 *
	 * @default __( 'Copy' )
	 */
	tooltipInitialText?: string;

	/**
	 * Label shown in the tooltip after a successful copy.
	 *
	 * @default __( 'Copied!' )
	 */
	tooltipSuccessText?: string;

	/**
	 * Custom icon. When omitted, the icon follows copy status.
	 */
	icon?: IconProps[ 'icon' ];

	/**
	 * Position of the clipboard icon relative to the button's children.
	 *
	 * @default 'start'
	 */
	iconPosition?: 'start' | 'end';

	/**
	 * Customize how the tooltip is positioned relative to the button. Accepts
	 * a `<Tooltip.Positioner />` element with custom positioning props
	 * (`side`, `align`, `sideOffset`, collision settings, etc.). When omitted,
	 * the tooltip uses the default placement.
	 */
	positioner?: TooltipPopupProps[ 'positioner' ];
};
