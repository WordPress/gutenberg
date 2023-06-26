/**
 * External dependencies
 */
import type { ReactNode } from 'react';
// eslint-disable-next-line no-restricted-imports
import type { RadioStateReturn } from 'reakit';

/**
 * Internal dependencies
 */
import type { BaseControlProps } from '../base-control/types';

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
	children: ReactNode;
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
	 * The initial value to be used when in uncontrolled mode.
	 */
	defaultValue?: string | number;
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
};

type ToggleGroupControlAsRadioContext = {
	isDeselectable?: false;
} & RadioStateReturn;

type ToggleGroupControlAsButtonContext = { isDeselectable: true } & Pick<
	RadioStateReturn,
	'state' | 'setState'
>;

export type ToggleGroupControlContextProps = Pick<
	ToggleGroupControlProps,
	'isBlock' | 'size'
> & {
	baseId: string;
} & ( ToggleGroupControlAsRadioContext | ToggleGroupControlAsButtonContext );

export type ToggleGroupControlMainControlProps = Pick<
	ToggleGroupControlProps,
	| 'children'
	| 'isAdaptiveWidth'
	| 'label'
	| 'size'
	| 'onChange'
	| 'value'
	| 'defaultValue'
>;
