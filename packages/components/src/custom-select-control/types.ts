/**
 * External dependencies
 */
import type { FocusEventHandler, MouseEventHandler } from 'react';

/**
 * The object structure for the options array.
 */
type Option = {
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
type ChangeObject = {
	highlightedIndex?: number;
	inputValue?: string;
	isOpen?: boolean;
	type?: string;
	selectedItem: Option;
};

export type CustomSelectProps = {
	/**
	 * Optional classname for the component.
	 */
	className?: string;
	/**
	 * Used to visually hide the label. It will always be visible to screen readers.
	 *
	 */
	hideLabelFromVision?: boolean;
	/**
	 * Pass in a description that will be shown to screen readers associated with the
	 * select trigger button. If no value is passed, the text "Currently selected:
	 * selectedItem.name" will be used fully translated.
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
	onChange?: ( newValue: ChangeObject ) => void;
	/**
	 * A handler for `onBlur` events.
	 *
	 * @ignore
	 */
	onBlur?: FocusEventHandler< HTMLButtonElement >;
	/**
	 * A handler for `onFocus` events.
	 *
	 * @ignore
	 */
	onFocus?: FocusEventHandler< HTMLButtonElement >;
	/**
	 * A handler for `onMouseOver` events.
	 *
	 * @ignore
	 */
	onMouseOut?: MouseEventHandler< HTMLButtonElement >;
	/**
	 * A handler for `onMouseOut` events.
	 *
	 * @ignore
	 */
	onMouseOver?: MouseEventHandler< HTMLButtonElement >;
	/**
	 * The options that can be chosen from.
	 */
	options: Array< Option >;
	/**
	 * The size of the control.
	 *
	 * @default 'default'
	 */
	size?: 'default' | 'small' | '__unstable-large';
	/**
	 * Can be used to externally control the value of the control.
	 */
	value?: Option;
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
};
