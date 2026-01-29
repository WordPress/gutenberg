/**
 * External dependencies
 */
import type { FocusEventHandler, MouseEventHandler } from 'react';

/**
 * The object structure for the options array.
 */
export type CustomSelectOption = {
	key: string;
	name: string;
	style?: React.CSSProperties;
	className?: string;
	hint?: string;
	/**
	 * Use the `hint` property instead
	 * @deprecated
	 * @ignore
	 */
	__experimentalHint?: string;
	[ key: string ]: any;
};

/**
 * The object returned from the onChange event.
 */
type CustomSelectChangeObject< T extends CustomSelectOption > = {
	highlightedIndex?: number;
	inputValue?: string;
	isOpen?: boolean;
	type?: string;
	selectedItem: T;
};

export type CustomSelectProps< T extends CustomSelectOption > = {
	/**
	 * Optional classname for the component.
	 */
	className?: string;
	/**
	 * Hide the label visually, while keeping available to assistive technology.
	 */
	hideLabelFromVision?: boolean;
	/**
	 * Description for the select trigger button used by assistive technology.
	 * If no value is passed, the text "Currently selected: selectedItem.name"
	 * will be used fully translated.
	 */
	describedBy?: string;
	/**
	 * Label for the control.
	 */
	label: string;
	/**
	 * Function called with the control's internal state changes. The `selectedItem`
	 * property contains the next selected item.
	 */
	onChange?: ( newValue: CustomSelectChangeObject< NoInfer< T > > ) => void;
	/**
	 * A handler for `blur` events on the trigger button.
	 *
	 * @ignore
	 */
	onBlur?: FocusEventHandler< HTMLButtonElement >;
	/**
	 * A handler for `focus` events on the trigger button.
	 *
	 * @ignore
	 */
	onFocus?: FocusEventHandler< HTMLButtonElement >;
	/**
	 * A handler for `mouseout` events on the trigger button.
	 *
	 * @ignore
	 */
	onMouseOut?: MouseEventHandler< HTMLButtonElement >;
	/**
	 * A handler for `mouseover` events on the trigger button.
	 *
	 * @ignore
	 */
	onMouseOver?: MouseEventHandler< HTMLButtonElement >;
	/**
	 * The list of options that can be chosen from.
	 */
	options: ReadonlyArray< T >;
	/**
	 * The size of the control.
	 *
	 * @default 'default'
	 */
	size?: 'default' | 'small' | '__unstable-large';
	/**
	 * Can be used to externally control the value of the control.
	 */
	value?: NoInfer< T >;
	/**
	 * Use the `showSelectedHint` property instead.
	 * @deprecated
	 * @ignore
	 */
	__experimentalShowSelectedHint?: boolean;
	/**
	 * Show the hint of the selected item in the trigger button.
	 *
	 * @default false
	 */
	showSelectedHint?: boolean;
	/**
	 * Opt-in prop for an unconstrained width style which became the default in
	 * WordPress 6.5. The prop is no longer needed and can be safely removed.
	 *
	 * @deprecated
	 * @ignore
	 */
	__nextUnconstrainedWidth?: boolean;
	/**
	 * Start opting into the larger default height that will become the default size in a future version.
	 *
	 * @default false
	 */
	__next40pxDefaultSize?: boolean;
	/**
	 * Do not throw a warning for the deprecated 36px default size.
	 * For internal components of other components that already throw the warning.
	 *
	 * @ignore
	 */
	__shouldNotWarnDeprecated36pxSize?: boolean;
};
