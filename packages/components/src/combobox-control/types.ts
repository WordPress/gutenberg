/**
 * Internal dependencies
 */
import type { BaseControlProps } from '../base-control/types';

export type ComboboxControlOption = {
	label: string;
	value: string;
	disabled?: boolean;
	[ key: string ]: any;
};

export type ComboboxControlProps = Pick<
	BaseControlProps,
	| '__nextHasNoMarginBottom'
	| 'className'
	| 'label'
	| 'hideLabelFromVision'
	| 'help'
> & {
	/**
	 * Custom renderer invoked for each option in the suggestion list.
	 * The render prop receives as its argument an object containing, under the `item` key,
	 * the single option's data (directly from the array of data passed to the `options` prop).
	 */
	__experimentalRenderItem?: ( args: {
		item: ComboboxControlOption;
	} ) => React.ReactNode;
	/**
	 * Deprecated. Use `__next40pxDefaultSize` instead.
	 *
	 * @default false
	 * @deprecated
	 * @ignore
	 */
	__next36pxDefaultSize?: boolean;
	/**
	 * Start opting into the larger default height that will become the default size in a future version.
	 *
	 * @default false
	 */
	__next40pxDefaultSize?: boolean;
	/**
	 * Show a reset button to clear the input.
	 *
	 * @default true
	 */
	allowReset?: boolean;
	/**
	 * Automatically expand the dropdown when the control is focused.
	 * If the control is clicked, the dropdown will expand regardless of this prop.
	 *
	 * @default true
	 */
	expandOnFocus?: boolean;
	/**
	 * Customizable UI messages.
	 */
	messages?: {
		/**
		 * The message to announce to screen readers when a suggestion is selected.
		 *
		 * @default `__( 'Item selected.' )`
		 */
		selected: string;
	};
	/**
	 * Function called with the selected value changes.
	 */
	onChange?: ( value: ComboboxControlProps[ 'value' ] ) => void;
	/**
	 * Function called when the control's search input value changes. The argument contains the next input value.
	 *
	 * @default noop
	 */
	onFilterValueChange?: ( value: string ) => void;
	/**
	 * The options that can be chosen from.
	 */
	options: ComboboxControlOption[];
	/**
	 * The current value of the control.
	 */
	value?: string | null;
	/**
	 * If passed, the combobox input will show a placeholder string if no values are present.
	 */
	placeholder?: string;
};
