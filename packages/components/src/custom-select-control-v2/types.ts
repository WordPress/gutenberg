/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type * as Ariakit from '@ariakit/react';
import type { FocusEventHandler, MouseEventHandler } from 'react';

export type CustomSelectStore = {
	/**
	 * The store object returned by Ariakit's `useSelectStore` hook.
	 */
	store: Ariakit.SelectStore;
};

export type CustomSelectContext = CustomSelectStore | undefined;

type CustomSelectSize< Size = 'compact' | 'default' > = {
	/**
	 * The size of the control.
	 *
	 * @default 'default'
	 */
	size?: Size;
};

export type CustomSelectButtonSize = CustomSelectSize<
	'compact' | 'default' | 'small'
>;

export type CustomSelectButtonProps = {
	/**
	 * An optional default value for the control when used in uncontrolled mode.
	 * If left `undefined`, the first non-disabled item will be used.
	 */
	defaultValue?: string | string[];
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
	 * The value of the control when used in uncontrolled mode.
	 */
	value?: string | string[];
};

export type _CustomSelectProps = CustomSelectButtonProps & {
	/**
	 * The child elements. This should be composed of `CustomSelectItem` components.
	 */
	children: React.ReactNode;
	/**
	 * Used to visually hide the label. It will always be visible to screen readers.
	 *
	 * @default false
	 */
	hideLabelFromVision?: boolean;
	/**
	 * Accessible label for the control.
	 */
	label: string;
};

export type CustomSelectProps = _CustomSelectProps &
	CustomSelectButtonProps &
	CustomSelectSize;

/**
 * The legacy object structure for the options array.
 */
type LegacyOption = {
	key: string;
	name: string;
	style?: React.CSSProperties;
	className?: string;
	__experimentalHint?: string;
};

/**
 * The legacy object returned from the onChange event.
 */
type LegacyOnChangeObject = {
	highlightedIndex?: number;
	inputValue?: string;
	isOpen?: boolean;
	type?: string;
	selectedItem: LegacyOption;
};

export type LegacyCustomSelectProps = {
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
	onChange?: ( newValue: LegacyOnChangeObject ) => void;
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
	options: Array< LegacyOption >;
	/**
	 * The size of the control.
	 *
	 * @default 'default'
	 */
	size?: 'default' | 'small' | '__unstable-large';
	/**
	 * Can be used to externally control the value of the control.
	 */
	value?: LegacyOption;
	/**
	 * Legacy way to add additional text to the right of each option.
	 *
	 * @default false
	 */
	__experimentalShowSelectedHint?: boolean;
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
	/**
	 * If true, the item will be disabled.
	 *
	 * You will need to add your own styles (e.g. reduced opacity) to visually show that they are disabled.
	 * @default false
	 */
	disabled?: boolean;
};
