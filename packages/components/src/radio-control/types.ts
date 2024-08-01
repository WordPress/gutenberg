/**
 * Internal dependencies
 */
import type { BaseControlProps } from '../base-control/types';

export type RadioControlProps = Pick<
	BaseControlProps,
	'label' | 'help' | 'hideLabelFromVision'
> & {
	/**
	 * A function that receives the value of the new option that is being
	 * selected as input.
	 */
	onChange: ( value: string ) => void;
	/**
	 * An array of objects containing the value and label of the options.
	 */
	options?: {
		/**
		 * The label to be shown to the user
		 */
		label: string;
		/**
		 * The internal value compared against select and passed to onChange
		 */
		value: string;
		/**
		 * Optional help text to be shown in addition the label.
		 */
		description?: string;
	}[];
	/**
	 * The value property of the currently selected option.
	 */
	selected?: string;
};
