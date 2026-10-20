import type { ComponentProps } from '../utils/types';

export type SelectionIndicatorProps = ComponentProps< 'span' > & {
	/**
	 * Whether the option is selected.
	 * @default false
	 */
	checked?: boolean;
	/**
	 * The selection control to depict.
	 * @default 'checkbox'
	 */
	type?: 'checkbox' | 'radio';
};
