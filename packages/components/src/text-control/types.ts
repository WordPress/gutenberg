/**
 * Internal dependencies
 */
import type { BaseControlProps } from '../base-control/types';

export type TextControlProps = Pick<
	BaseControlProps,
	'className' | 'hideLabelFromVision' | 'help' | 'label'
> & {
	/**
	 * Start opting into the new margin-free styles that will become the default in a future version.
	 *
	 * @deprecated Default behavior since WP 7.0. Prop can be safely removed.
	 * @ignore
	 *
	 * @default false
	 */
	__nextHasNoMarginBottom?: boolean;
	/**
	 * A function that receives the value of the input.
	 */
	onChange: ( value: string ) => void;
	/**
	 * The current value of the input.
	 */
	value: string | number;
	/**
	 * Type of the input element to render. Defaults to "text".
	 *
	 * @default 'text'
	 */
	type?:
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

	/**
	 * Start opting into the larger default height that will become the default size in a future version.
	 *
	 * @default false
	 */
	__next40pxDefaultSize?: boolean;
};
