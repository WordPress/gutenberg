/**
 * External dependencies
 */
import type { ChangeEvent, FocusEvent, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { InputBaseProps } from '../input-control/types';
import type { BaseControlProps } from '../base-control/types';

type SelectControlBaseProps = Pick<
	InputBaseProps,
	| '__next36pxDefaultSize'
	| 'disabled'
	| 'hideLabelFromVision'
	| 'label'
	| 'labelPosition'
	| 'prefix'
	| 'size'
	| 'suffix'
> &
	Pick< BaseControlProps, 'help' | '__nextHasNoMarginBottom' > & {
		onBlur?: ( event: FocusEvent< HTMLSelectElement > ) => void;
		onFocus?: ( event: FocusEvent< HTMLSelectElement > ) => void;
		options?: {
			/**
			 * The label to be shown to the user.
			 */
			label: string;
			/**
			 * The internal value used to choose the selected value.
			 * This is also the value passed to `onChange` when the option is selected.
			 */
			value: string;
			id?: string;
			/**
			 * Whether or not the option should have the disabled attribute.
			 *
			 * @default false
			 */
			disabled?: boolean;
			/**
			 * Whether or not the option should be hidden.
			 *
			 * @default false
			 */
			hidden?: boolean;
		}[];
		/**
		 * As an alternative to the `options` prop, `optgroup`s and `options` can be
		 * passed in as `children` for more customizability.
		 */
		children?: ReactNode;
	};

export type SelectControlSingleSelectionProps = SelectControlBaseProps & {
	/**
	 * If this property is added, multiple values can be selected. The `value` passed should be an array.
	 *
	 * In most cases, it is preferable to use the `FormTokenField` or `CheckboxControl` components instead.
	 *
	 * @default false
	 */
	multiple?: false;
	value?: string;
	/**
	 * A function that receives the value of the new option that is being selected as input.
	 *
	 * If `multiple` is `true`, the value received is an array of the selected value.
	 * Otherwise, the value received is a single value with the new selected value.
	 */
	onChange?: (
		value: string,
		extra?: { event?: ChangeEvent< HTMLSelectElement > }
	) => void;
};

export type SelectControlMultipleSelectionProps = SelectControlBaseProps & {
	/**
	 * If this property is added, multiple values can be selected. The `value` passed should be an array.
	 *
	 * In most cases, it is preferable to use the `FormTokenField` or `CheckboxControl` components instead.
	 *
	 * @default false
	 */
	multiple: true;
	value?: string[];
	/**
	 * A function that receives the value of the new option that is being selected as input.
	 *
	 * If `multiple` is `true`, the value received is an array of the selected value.
	 * Otherwise, the value received is a single value with the new selected value.
	 */
	onChange?: (
		value: string[],
		extra?: { event?: ChangeEvent< HTMLSelectElement > }
	) => void;
};

export type SelectControlProps =
	| SelectControlSingleSelectionProps
	| SelectControlMultipleSelectionProps;
