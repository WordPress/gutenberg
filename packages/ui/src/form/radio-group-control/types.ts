import type { RadioGroupProps } from '../primitives/radio-group/types';
import type { ControlProps } from '../types';

export type RadioGroupControlProps = Omit<
	RadioGroupProps< string >,
	'children'
> &
	ControlProps & {
		/**
		 * The radio options to render.
		 */
		items: {
			/**
			 * The accessible label for the option.
			 */
			label: string;
			/**
			 * The option value submitted with the form.
			 */
			value: string;
			/**
			 * The accessible description for the option.
			 */
			description?: string;
			/**
			 * Whether the option should ignore user interaction.
			 */
			disabled?: boolean;
		}[];
	};
