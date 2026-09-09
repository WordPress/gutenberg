import type { ReactNode } from 'react';
import type { ButtonIconProps, ButtonProps } from '../button/types';
import type { PopupProps as TooltipPopupProps } from '../tooltip/types';

export type ClipboardButtonStatus = 'pending' | 'success';

export type ClipboardButtonOnCopy = ( text: string, result: boolean ) => void;

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
	onCopy?: ClipboardButtonOnCopy;

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
	 * Customize how the tooltip is positioned relative to the button. Accepts
	 * a `<Tooltip.Positioner />` element with custom positioning props
	 * (`side`, `align`, `sideOffset`, collision settings, etc.). When omitted,
	 * the tooltip uses the default placement.
	 */
	positioner?: TooltipPopupProps[ 'positioner' ];
};

export type ClipboardButtonIconProps = Omit< ButtonIconProps, 'icon' > & {
	/**
	 * Custom icon shown while copy status is pending. When omitted, a copy
	 * icon is used. Success still shows a check icon.
	 */
	icon?: ButtonIconProps[ 'icon' ];
};

export type ClipboardButtonLabelProps = {
	/**
	 * Text shown before copying.
	 *
	 * @default __( 'Copy' )
	 */
	pending?: ReactNode;

	/**
	 * Text shown after a successful copy.
	 *
	 * @default __( 'Copied' )
	 */
	success?: ReactNode;
};
