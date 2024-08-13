/**
 * Internal dependencies
 */
import type { BaseControlProps } from '../base-control/types';

export type TextControlPropsType =
	| 'date'
	| 'datetime-local'
	| 'email'
	| 'number'
	| 'password'
	| 'tel'
	| 'text'
	| 'time'
	| 'search'
	| 'url';

export type ValueOfType< T extends TextControlPropsType > = T extends 'number'
	? number
	: string;

export type TextControlProps< T extends TextControlPropsType = 'text' > = Pick<
	BaseControlProps,
	| 'className'
	| 'hideLabelFromVision'
	| 'help'
	| 'label'
	| '__nextHasNoMarginBottom'
> & {
	/**
	 * A function that receives the value of the input.
	 */
	onChange: ( value: ValueOfType< T > ) => void;
	/**
	 * The current value of the input.
	 */
	value: ValueOfType< T >;
	/**
	 * Type of the input element to render. Defaults to "text".
	 *
	 * @default 'text'
	 */
	type?: T;

	/**
	 * Start opting into the larger default height that will become the default size in a future version.
	 *
	 * @default false
	 */
	__next40pxDefaultSize?: boolean;
};
