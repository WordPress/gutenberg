/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref, RefObject } from 'react';

/**
 * Internal dependencies
 */
import type { FormElementProps, SizeRangeDefault } from '../utils/types';
import type { PolymorphicComponent } from '../ui/context';

/**
 * Option to render within `SegmentedControl`.
 *
 * @example
 * ```jsx
 * const option = { id: 'elsa', value: 'elsa', label: 'Elsa' };
 * ```
 */
export type SegmentedControlOption = {
	id: string | number;
	value: string | number;
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
	 * Renders `SegmentedControl` is a (CSS) block element.
	 *
	 * @default false
	 */
	isBlock?: boolean;
	/**
	 * Options to render within `SegmentedControl`.
	 *
	 * @example
	 * ```jsx
	 * const options = [
	 *  { id: 'elsa', value: 'elsa', label: 'Elsa' },
	 *  { id: 'ana', value: 'ana', label: 'Ana' },
	 * ]
	 *
	 * const Heroes = <SegmentedControl options={options} />
	 * ```
	 */
	options?: Array< SegmentedControlOption >;
	/**
	 * Callback when a segment is selected.
	 */
	onChange?: ( ...args: any ) => void;
	/**
	 * Determines the size of `SegmentedControl`.
	 *
	 * @default 'medium'
	 */
	size?: SizeRangeDefault;
	/**
	 * The value of `SegmentedControl`
	 */
	value?: string | number;
};

/**
 * `SegmentedControl` is a form component that lets users choose options represented in horizontal segments.
 *
 * @example
 * ```jsx
 * <SegmentedControl options={[...]} />
 * ```
 */
export type SegmentedControl = PolymorphicComponent<
	'input',
	SegmentedControlProps
>;

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
	value?: string | number;
	state?: any;
};

export type SegmentedControlBackdropProps = {
	containerRef: RefObject< any >;
	containerWidth?: number | null;
	state?: any;
};
