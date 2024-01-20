/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type * as Ariakit from '@ariakit/react';
import type { FocusEventHandler, MouseEventHandler } from 'react';
/**
 * Internal dependencies
 */
import type { InputBaseProps } from '../input-control/types';

export type CustomSelectStore = {
	/**
	 * The store object returned by Ariakit's `useSelectStore` hook.
	 */
	store: Ariakit.SelectStore;
};

export type CustomSelectContext = CustomSelectStore | undefined;

export type CustomSelectProps = {
	/**
	 * The child elements. This should be composed of CustomSelectItem components.
	 */
	children: React.ReactNode;
	/**
	 * An optional default value for the control. If left `undefined`, the first
	 * non-disabled item will be used.
	 */
	defaultValue?: string | string[];
	/**
	 * Used to visually hide the label. It will always be visible to screen readers.
	 *
	 * @default false
	 */
	hideLabelFromVision?: boolean;
	/**
	 * Label for the control.
	 */
	label: string;
	/**
	 * A function that receives the new value of the input.
	 */
	onChange?: ( newValue: string | string[] ) => void;
	/**
	 * Can be used to render select UI with custom styled values.
	 */
	renderSelectedValue?: (
		selectedValue: string | string[]
	) => React.ReactNode;
	/**
	 * The size of the control.
	 *
	 * @default default
	 */
	size?: 'compact' | 'default' | 'small';
	/**
	 * Can be used to externally control the value of the control.
	 */
	value?: string | string[];
};
/**
 * The legacy object structure for the options array.
 */
type Option = {
	key: string;
	name: string;
	style?: {};
	className?: string;
	__experimentalHint?: string;
};

/**
 * The legacy object returned from the onChange event.
 */
type OnChangeObject = {
	selectedItem: Option;
	highlightedIndex?: number;
	isOpen?: boolean;
};

export type LegacyCustomSelectProps = Pick<
	InputBaseProps,
	'__next40pxDefaultSize' | 'size'
> & {
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
	onChange?: ( newValue: OnChangeObject ) => void;
	/**
	 * A handler for `onBlur` events.
	 */
	onBlur?: FocusEventHandler< HTMLButtonElement >;
	/**
	 * A handler for `onFocus` events.
	 */
	onFocus?: FocusEventHandler< HTMLButtonElement >;
	/**
	 * A handler for `onMouseOver` events.
	 */
	onMouseOut?: MouseEventHandler< HTMLButtonElement >;
	/**
	 * A handler for `onMouseOut` events.
	 */
	onMouseOver?: MouseEventHandler< HTMLButtonElement >;
	/**
	 * The options that can be chosen from.
	 */
	options: Array< Option >;
	/**
	 * Can be used to externally control the value of the control.
	 */
	value?: Option;
	/**
	 * Legacy way to add additional text to the right of each option.
	 *
	 * @default false
	 */
	__experimentalShowSelectedHint?: boolean;
	/**
	 * Opt-in prop for an unconstrained width style which became the default in
	 * WordPress 6.4. The prop is no longer needed and can be safely removed.
	 *
	 * @deprecated
	 */
	__nextUnconstrainedWidth?: boolean;
};

export type CustomSelectItemProps = {
	/**
	 * The value of the select item. This will be used as the children if
	 * children are left `undefined`.
	 */
	value: string;
	/**
	 * The children to display for each select item. The `value` will be
	 * used if left `undefined`.
	 */
	children?: React.ReactNode;
};
