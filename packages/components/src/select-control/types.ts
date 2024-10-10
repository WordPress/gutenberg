/**
 * External dependencies
 */
import type { ChangeEvent, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { InputBaseProps } from '../input-control/types';
import type { BaseControlProps } from '../base-control/types';

type SelectControlBaseProps< V extends string > = Pick<
	InputBaseProps,
	| '__next36pxDefaultSize'
	| '__next40pxDefaultSize'
	| 'disabled'
	| 'hideLabelFromVision'
	| 'label'
	| 'labelPosition'
	| 'prefix'
	| 'size'
	| 'suffix'
> &
	Pick< BaseControlProps, 'help' | '__nextHasNoMarginBottom' > & {
		/**
		 * An array of option property objects to be rendered,
		 * each with a `label` and `value` property, as well as any other
		 * `<option>` attributes.
		 */
		options?: readonly ( {
			/**
			 * The label to be shown to the user.
			 */
			label: string;
			/**
			 * The internal value used to choose the selected value.
			 * This is also the value passed to `onChange` when the option is selected.
			 */
			value: V;
		} & Omit<
			React.OptionHTMLAttributes< HTMLOptionElement >,
			'label' | 'value'
		> )[];
		/**
		 * As an alternative to the `options` prop, `optgroup`s and `options` can be
		 * passed in as `children` for more customizability.
		 */
		children?: ReactNode;
		/**
		 * The style variant of the control.
		 *
		 * @default 'default'
		 */
		variant?: 'default' | 'minimal';
	};

export type SelectControlSingleSelectionProps< V extends string = string > =
	SelectControlBaseProps< V > & {
		/**
		 * If this property is added, multiple values can be selected. The `value` passed should be an array.
		 *
		 * In most cases, it is preferable to use the `FormTokenField` or `CheckboxControl` components instead.
		 *
		 * @default false
		 */
		multiple?: false;
		/**
		 * The value of the selected option.
		 *
		 * If `multiple` is true, the `value` should be an array with the values of the selected options.
		 */
		value?: NoInfer< V >;
		/**
		 * A function that receives the value of the new option that is being selected as input.
		 *
		 * If `multiple` is `true`, the value received is an array of the selected value.
		 * Otherwise, the value received is a single value with the new selected value.
		 */
		onChange?: (
			value: NoInfer< V >,
			extra?: { event?: ChangeEvent< HTMLSelectElement > }
		) => void;
	};

export type SelectControlMultipleSelectionProps< V extends string > =
	SelectControlBaseProps< V > & {
		/**
		 * If this property is added, multiple values can be selected. The `value` passed should be an array.
		 *
		 * In most cases, it is preferable to use the `FormTokenField` or `CheckboxControl` components instead.
		 *
		 * @default false
		 */
		multiple: true;
		/**
		 * The value of the selected option.
		 *
		 * If `multiple` is true, the `value` should be an array with the values of the selected options.
		 */
		value?: NoInfer< V >[];
		/**
		 * A function that receives the value of the new option that is being selected as input.
		 *
		 * If `multiple` is `true`, the value received is an array of the selected value.
		 * Otherwise, the value received is a single value with the new selected value.
		 */
		onChange?: (
			value: NoInfer< V >[],
			extra?: { event?: ChangeEvent< HTMLSelectElement > }
		) => void;
	};

export type SelectControlProps< V extends string = string > =
	| SelectControlSingleSelectionProps< V >
	| SelectControlMultipleSelectionProps< V >;
