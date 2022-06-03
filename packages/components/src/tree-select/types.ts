/**
 * External dependencies
 */
import type { ChangeEvent } from 'react';

/**
 * Internal dependencies
 */
import type { SelectControlProps } from '../select-control/types';

export interface Tree {
	id: string;
	name: string;
	children?: Tree[];
}

export interface TreeSelectProps
	extends Omit< SelectControlProps, 'value' | 'onChange' > {
	/**
	 * If this property is added, an option will be added with this label to represent empty selection.
	 */
	noOptionLabel?: string;
	/**
	 * An array containing the tree objects with the possible nodes the user can select.
	 */
	tree?: Tree[];
	/**
	 * The id of the currently selected node.
	 */
	selectedId?: string;
	/**
	 * A function that receives the id of the new node element that is being selected.
	 */
	onChange: (
		value: string,
		extra?: { event?: ChangeEvent< HTMLSelectElement > }
	) => void;
}
