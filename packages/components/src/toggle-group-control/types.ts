/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { MutableRefObject, Ref, ReactNode, ReactText } from 'react';
// eslint-disable-next-line no-restricted-imports
import type { RadioStateReturn } from 'reakit';

/**
 * Internal dependencies
 */
import type { FormElementProps } from '../utils/types';

export type ToggleGroupControlOptionProps = {
	value: ReactText;
	label: string;
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

export type ToggleGroupControlButtonProps = {
	className?: string;
	forwardedRef?: Ref< any >;
	/**
	 * Renders `ToggleGroupControl` is a (CSS) block element.
	 *
	 * @default false
	 */
	isBlock?: boolean;
	label: string;
	showSeparator?: boolean;
	value?: ReactText;
	state?: any;
};

export type ToggleGroupControlBackdropProps = {
	containerRef: MutableRefObject< HTMLElement | undefined >;
	containerWidth?: number | null;
	isAdaptiveWidth?: boolean;
	state?: any;
};
