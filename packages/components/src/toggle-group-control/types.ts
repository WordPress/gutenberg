/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { BaseControlProps } from '../base-control/types';
import type { TooltipProps } from '../tooltip/types';

export type ToggleGroupControlOptionBaseProps = {
	children: ReactNode;
	/**
	 * Style the option as an icon option.
	 *
	 * @default false
	 */
	isIcon?: boolean;
	value: string | number;
	/**
	 * Whether to display a Tooltip for the control option. If set to `true`, the tooltip will
	 * show the aria-label or the label prop text.
	 *
	 * @default false
	 */
	showTooltip?: boolean;
};

export type ToggleGroupControlOptionIconProps = Pick<
	ToggleGroupControlOptionBaseProps,
	'value'
> & {
	/**
	 * Icon displayed as the content of the option. Usually one of the icons from
	 * the `@wordpress/icons` package, or a custom React `<svg>` icon.
	 */
	icon: JSX.Element;
	/**
	 * The text to accessibly label the icon option. Will also be shown in a tooltip.
	 */
	label: string;
};

export type ToggleGroupControlOptionProps = Pick<
	ToggleGroupControlOptionBaseProps,
	'value' | 'showTooltip'
> & {
	/**
	 * Label for the option. If needed, the `aria-label` prop can be used in addition
	 * to specify a different label for assistive technologies.
	 */
	label: string;
};

export type WithToolTipProps = {
	/**
	 * React children
	 */
	children: TooltipProps[ 'children' ];
	/**
	 * Label for the Tooltip component.
	 */
	text?: string;
	/**
	 * Whether to wrap the control option in a Tooltip component.
	 *
	 * @default false
	 */
	showTooltip?: boolean;
};

export type ToggleGroupControlProps = Pick<
	BaseControlProps,
	'help' | '__nextHasNoMarginBottom'
> & {
	/**
	 * Label for the control.
	 */
	label: string;
	/**
	 * If true, the label will only be visible to screen readers.
	 *
	 * @default false
	 */
	hideLabelFromVision?: boolean;
	/**
	 * Determines if segments should be rendered with equal widths.
	 *
	 * @default false
	 */
	isAdaptiveWidth?: boolean;
	/**
	 * Renders `ToggleGroupControl` as a (CSS) block element, spanning the entire width of
	 * the available space. This is the recommended style when the options are text-based and not icons.
	 *
	 * @default false
	 */
	isBlock?: boolean;
	/**
	 * Whether an option can be deselected by clicking it again.
	 *
	 * @default false
	 */
	isDeselectable?: boolean;
	/**
	 * Callback when a segment is selected.
	 */
	onChange?: ( value: string | number | undefined ) => void;
	/**
	 * The selected value.
	 */
	value?: string | number;
	/**
	 * The options to render in the `ToggleGroupControl`, using either the `ToggleGroupControlOption` or
	 * `ToggleGroupControlOptionIcon` components.
	 */
	children: ReactNode;
	/**
	 * The size variant of the control.
	 *
	 * @default 'default'
	 */
	size?: 'default' | '__unstable-large';
	/**
	 * Start opting into the larger default height that will become the default size in a future version.
	 *
	 * @default false
	 */
	__next40pxDefaultSize?: boolean;
	/**
	 * Do not throw a warning for the deprecated 36px default size.
	 * For internal components of other components that already throw the warning.
	 *
	 * @ignore
	 */
	__shouldNotWarnDeprecated36pxSize?: boolean;
};

export type ToggleGroupControlContextProps = {
	activeItemIsNotFirstItem?: () => boolean;
	isDeselectable?: boolean;
	baseId: string;
	isBlock: ToggleGroupControlProps[ 'isBlock' ];
	size: ToggleGroupControlProps[ 'size' ];
	value: ToggleGroupControlProps[ 'value' ];
	setValue: ( newValue: string | number | undefined ) => void;
	setSelectedElement: ( element: HTMLElement | undefined ) => void;
};

export type ToggleGroupControlMainControlProps = Pick<
	ToggleGroupControlProps,
	'children' | 'isAdaptiveWidth' | 'label' | 'size' | 'onChange' | 'value'
> &
	Pick< ToggleGroupControlContextProps, 'setSelectedElement' >;
