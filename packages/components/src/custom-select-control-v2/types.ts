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
	defaultValue?: string | readonly string[];
	/**
	 * A function that receives the new value of the input.
	 */
	onChange?: ( newValue: string | readonly string[] ) => void;
	/**
	 * Can be used to render select UI with custom styled values.
	 */
	renderSelectedValue?: (
		selectedValue: string | readonly string[]
	) => React.ReactNode;
	/**
	 * The value of the control when used in uncontrolled mode.
	 */
	value?: string | readonly string[];
};

// Props only exposed on the internal implementation
export type CustomSelectInternalProps = {
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
	/**
	 * Determines whether the dropdown popover should be rendered as a React
	 * Portal. When portaled, the popover escapes ancestor stacking contexts
	 * and `overflow` containers, but consumers lose the ability to target it
	 * via descendant selectors.
	 *
	 * @default false
	 */
	portal?: Ariakit.SelectPopoverProps[ 'portal' ];
	/**
	 * The DOM element (or a memoized callback returning one) into which the
	 * popover should be rendered when `portal` is `true`. When omitted, the
	 * popover is appended to the document `body`.
	 */
	portalElement?: Ariakit.SelectPopoverProps[ 'portalElement' ];
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
