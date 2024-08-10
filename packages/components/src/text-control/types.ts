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

export type TextControlProps<
	Type extends TextControlPropsType = 'text',
	Value extends string | number = Type extends 'number' ? number : string,
> = Pick<
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
	onChange: ( value: NoInfer< Value > ) => void;
	/**
	 * The current value of the input.
	 */
	value: NoInfer< Value >;
	/**
	 * Type of the input element to render. Defaults to "text".
	 *
	 * @default 'text'
	 */
	type?: Type;

	/**
	 * Start opting into the larger default height that will become the default size in a future version.
	 *
	 * @default false
	 */
	__next40pxDefaultSize?: boolean;
};
