/**
 * External dependencies
 */
import type { ReactNode, ReactText } from 'react';
// eslint-disable-next-line no-restricted-imports
import type { RadioStateReturn } from 'reakit';

/**
 * Internal dependencies
 */
import type { FormElementProps } from '../utils/types';

export type ToggleGroupControlOptionProps = {
	value: ReactText;
	/**
	 * Label for the option. If needed, the `aria-label` prop can be used in addition
	 * to specify a different label for assistive technologies.
	 */
	label: string;
	/**
	 * Whether to display a Tooltip for the control option. If set to `true`, the tooltip will
	 * show the aria-label or the label prop text.
	 *
	 * @default false
	 */
	showTooltip?: boolean;
};

export type WithToolTipProps = {
	/**
	 * React children
	 */
	children: ReactNode;
	/**
	 * Label for the Tooltip component.
	 */
	text: string;
	/**
	 * Whether to wrap the control option in a Tooltip component.
	 *
	 * @default false
	 */
	showTooltip?: boolean;
};

export type ToggleGroupControlProps = Omit<
	FormElementProps< any >,
	'defaultValue'
> & {
	/**
	 * Label for the form element.
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
	 * Renders `ToggleGroupControl` as a (CSS) block element.
	 *
	 * @default false
	 */
	isBlock?: boolean;
	/**
	 * Callback when a segment is selected.
	 */
	onChange?: ( value: ReactText | undefined ) => void;
	/**
	 * The value of `ToggleGroupControl`
	 */
	value?: ReactText;
	/**
	 * React children
	 */
	children: ReactNode;
	/**
	 * If this property is added, a help text will be generated
	 * using help property as the content.
	 */
	help?: ReactNode;
};

export type ToggleGroupControlContextProps = RadioStateReturn & {
	/**
	 * Renders `ToggleGroupControl` as a (CSS) block element.
	 *
	 * @default false
	 */
	isBlock?: boolean;
};
