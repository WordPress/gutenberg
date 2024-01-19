/**
 * Internal dependencies
 */
import type { InputControlProps } from '../input-control/types';

export type SearchControlProps = Pick<
	InputControlProps,
	| 'help'
	| 'hideLabelFromVision'
	| 'label'
	| 'onDrag'
	| 'onDragStart'
	| 'onDragEnd'
	| 'value'
> & {
	/**
	 * @deprecated This is now the default.
	 * @ignore
	 */
	__next40pxDefaultSize?: boolean;
	/**
	 * Start opting into the new margin-free styles that will become the default in a future version.
	 *
	 * @default false
	 */
	__nextHasNoMarginBottom?: boolean;
	/**
	 * A function that receives the value of the input when the value is changed.
	 */
	onChange: ( value: string ) => void;
	/**
	 * When an `onClose` callback is provided, the search control will render a close button
	 * that will trigger the given callback.
	 *
	 * Use this if you want the button to trigger your own logic to close the search field entirely,
	 * rather than just clearing the input value.
	 */
	onClose?: () => void;
	/**
	 * A placeholder for the input.
	 *
	 * @default 'Search'
	 */
	placeholder?: InputControlProps[ 'placeholder' ];
	/**
	 * The size of the component
	 *
	 * @default 'default'
	 */
	size?: 'default' | 'compact';
};
