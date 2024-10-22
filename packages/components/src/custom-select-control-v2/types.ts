/**
 * External dependencies
 */
import type * as Ariakit from '@ariakit/react';

export type CustomSelectStore = {
	/**
	 * The store object returned by Ariakit's `useSelectStore` hook.
	 */
	store: Ariakit.SelectStore;
};

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

export type CustomSelectContext =
	| ( CustomSelectStore & CustomSelectButtonSize )
	| undefined;

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

// Props only exposed on the internal implementation
export type _CustomSelectInternalProps = {
	/**
	 * True if the consumer is emulating the legacy component behavior and look
	 */
	isLegacy?: boolean;
};

// Props that are exposed in exported components
export type _CustomSelectProps = CustomSelectButtonProps & {
	/**
	 * Additional className added to the root wrapper element.
	 */
	className?: string;
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

export type CustomSelectProps = _CustomSelectProps & CustomSelectSize;

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
