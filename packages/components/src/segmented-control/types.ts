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

export type SegmentedControlOptionProps = {
	value: ReactText;
	label: string;
};

export type SegmentedControlProps = Omit<
	FormElementProps< any >,
	'defaultValue'
> & {
	/**
	 * Label for the form element.
	 */
	label: string;
	/**
	 * ID that will serve as a base for all the items IDs.
	 *
	 * @see https://reakit.io/docs/radio/#useradiostate
	 */
	baseId?: string;
	/**
	 * Determines if segments should be rendered with equal widths.
	 *
	 * @default false
	 */
	isAdaptiveWidth?: boolean;
	/**
	 * Renders `SegmentedControl` as a (CSS) block element.
	 *
	 * @default false
	 */
	isBlock?: boolean;
	/**
	 * Callback when a segment is selected.
	 */
	onChange?: ( value: ReactText | undefined ) => void;
	/**
	 * The value of `SegmentedControl`
	 */
	value?: ReactText;
	/**
	 * React children
	 */
	children: ReactNode;
};

export type SegmentedControlContextProps = RadioStateReturn & {
	/**
	 * Renders `SegmentedControl` as a (CSS) block element.
	 *
	 * @default false
	 */
	isBlock?: boolean;
};

export type SegmentedControlButtonProps = {
	className?: string;
	forwardedRef?: Ref< any >;
	/**
	 * Renders `SegmentedControl` is a (CSS) block element.
	 *
	 * @default false
	 */
	isBlock?: boolean;
	label: string;
	showSeparator?: boolean;
	value?: ReactText;
	state?: any;
};

export type SegmentedControlBackdropProps = {
	containerRef: MutableRefObject< HTMLElement | undefined >;
	containerWidth?: number | null;
	state?: any;
};
