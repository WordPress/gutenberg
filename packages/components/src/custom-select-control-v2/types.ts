/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type * as Ariakit from '@ariakit/react';

export type CustomSelectContext =
	| {
			/**
			 * The store object returned by Ariakit's `useSelectStore` hook.
			 */
			store: Ariakit.SelectStore;
	  }
	| undefined;

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
	 * @default 'default'
	 */
	size?: 'default' | 'small';
	/**
	 * Can be used to externally control the value of the control.
	 */
	value?: string | string[];
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
