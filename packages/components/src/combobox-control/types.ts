/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type DetectOutsideProps = {
	onFocusOutside: ( event: Event ) => void;
	children: ReactNode;
};

export type Option = {
	value: string;
	label: string;
};

export type ComboboxControlProps = {
	/**
	 * Whether to render a reset button.
	 *
	 * @default true
	 */
	allowReset?: boolean;
	/**
	 * The component class name.
	 */
	className?: string;
	/**
	 * If this property is added, a help text will be generated using
	 * help property as the content.
	 */
	help?: string;
	/**
	 * If true, the label will only be visible to screen readers.
	 */
	hideLabelFromVision?: boolean;
	/**
	 * The label for the control.
	 */
	label: string;
	/**
	 * Messages to display.
	 *
	 * @default { selected: __( 'Item selected.' ) }
	 */
	messages?: Record< string, string >;
	/**
	 * Function called with the selected value changes.
	 */
	onChange?: ( selectedValue: string ) => void;
	/**
	 * Function called with the control's search input value changes.
	 * The argument contains the next input value.
	 *
	 * @default () => void
	 */
	onFilterValueChange?: ( nextInput: string ) => void;
	/**
	 * The options that can be chosen from.
	 */
	options: Option[];
	/**
	 * The current value of the input.
	 */
	value?: string;
	/**
	 * Custom renderer invoked for each option in the suggestion list.
	 * The render prop receives as its argument an object containing,
	 * under the `item` key, the single option's data (directly from
	 * the array of data passed to the `options` prop).
	 */
	__experimentalRenderItem?: (
		item: Record< 'item', Record< string, unknown > >
	) => ReactNode;
	/**
	 * Starts opting into 36px default size styling.
	 */
	__next36pxDefaultSize?: boolean;
	/**
	 * Starts opting into the new margin-free styles
	 * that will become the default in a future version.
	 *
	 * @default false
	 */
	__nextHasNoMarginBottom?: boolean;
};
