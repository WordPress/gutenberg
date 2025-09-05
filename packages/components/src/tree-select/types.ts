/**
 * Internal dependencies
 */
import type { SelectControlSingleSelectionProps } from '../select-control/types';

export type Truthy< T > = T extends false | '' | 0 | null | undefined
	? never
	: T;

export interface Tree {
	id: string;
	name: string;
	children?: Tree[];
}

// `TreeSelect` inherits props from `SelectControl`, but only
// in single selection mode (ie. when the `multiple` prop is not defined).
export interface TreeSelectProps
	extends Omit<
		SelectControlSingleSelectionProps,
		'value' | 'multiple' | 'onChange'
	> {
	/**
	 * If this property is added, an option will be added with this label to represent empty selection.
	 */
	noOptionLabel?: string;
	/**
	 * A function that receives the value of the new option that is being selected as input.
	 */
	onChange?: SelectControlSingleSelectionProps[ 'onChange' ];
	/**
	 * An array containing the tree objects with the possible nodes the user can select.
	 */
	tree?: Tree[];
	/**
	 * The id of the currently selected node.
	 */
	selectedId?: SelectControlSingleSelectionProps[ 'value' ];
}
