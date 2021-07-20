/**
 * Internal dependencies
 */
import type { BaseFieldProps } from '../base-field';
import type { FormElementProps, SizeRangeReduced } from '../utils/types';

type Value = string | number;

export interface Props
	extends Omit< BaseFieldProps, 'children' >,
		FormElementProps< Value > {
	size?: SizeRangeReduced;
	onChange?: ( value: Value ) => void;
	value?: Value;
}
