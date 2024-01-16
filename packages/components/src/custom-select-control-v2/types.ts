/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type * as Ariakit from '@ariakit/react';
/**
 * Internal dependencies
 */
import type { useDeprecatedProps } from './use-deprecated-props';

export type LegacyAdapterProps = Parameters< typeof useDeprecatedProps >[ 0 ];

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
	 * @default 'default'
	 */
	size?: 'default' | 'small';
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
};

export type LegacyCustomSelectProps = {
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
	 * A function that receives the new value of the input.
	 */
	onChange?: ( newValue: OnChangeObject ) => void;
	/**
	 * The options that can be chosen from.
	 */
	options: Array< Option >;
	/**
	 * The size of the control.
	 *
	 * @default 'default'
	 */
	size?: CustomSelectProps[ 'size' ];
	/**
	 * Can be used to externally control the value of the control.
	 */
	value?: Option;
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
