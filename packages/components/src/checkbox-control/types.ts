/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { BaseControlProps } from '../base-control/types';

export type CheckboxControlProps = Pick<
	BaseControlProps,
	'help' | '__nextHasNoMarginBottom'
> & {
	/**
	 * A function that receives the checked state (boolean) as input.
	 */
	onChange: ( value: boolean ) => void;
	/**
	 * A label for the input field, that appears at the side of the checkbox.
	 * The prop will be rendered as content a label element. If no prop is
	 * passed an empty label is rendered.
	 */
	label?: string;
	/**
	 * If checked is true the checkbox will be checked. If checked is false the
	 * checkbox will be unchecked. If no value is passed the checkbox will be
	 * unchecked.
	 */
	checked?: boolean;
	/**
	 * If indeterminate is true the state of the checkbox will be indeterminate.
	 */
	indeterminate?: boolean;
	/**
	 * @deprecated
	 */
	heading?: ReactNode;
};
