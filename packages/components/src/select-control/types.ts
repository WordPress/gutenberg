/**
 * External dependencies
 */
import type { ChangeEvent, FocusEvent, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { InputBaseProps, LabelPosition } from '../input-control/types';

export type Size = 'default' | 'small' | '__unstable-large';

export interface SelectControlProps
	extends Pick< InputBaseProps, 'label' | 'prefix' | 'suffix' > {
	/**
	 * If this property is added, a help text will be generated using help property as the content.
	 */
	help?: string;
	/**
	 * If true, the label will only be visible to screen readers.
	 */
	hideLabelFromVision?: boolean;
	/**
	 * If this property is added, multiple values can be selected. The value passed should be an array.
	 *
	 * @default false
	 */
	multiple?: boolean;
	onBlur?: ( event: FocusEvent< HTMLSelectElement > ) => void;
	onFocus?: ( event: FocusEvent< HTMLSelectElement > ) => void;
	/**
	 * A function that receives the value of the new option that is being selected as input.
	 *
	 * If `multiple` is `true`, the value received is an array of the selected value.
	 * Otherwise, the value received is a single value with the new selected value.
	 */
	onChange?: (
		value: string | string[],
		extra?: { event?: ChangeEvent< HTMLSelectElement > }
	) => void;
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
	}[];
	size?: Size;
	value?: string | string[];
	/**
	 * The position of the label.
	 *
	 * @default 'top'
	 */
	labelPosition?: LabelPosition;
	/**
	 * As an alternative to the `options` prop, `optgroup`s and `options` can be
	 * passed in as `children` for more customizability.
	 */
	children?: ReactNode;
}
