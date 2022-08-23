/**
 * External dependencies
 */
import type { ComponentProps } from 'react';

/**
 * Internal dependencies
 */
import type SelectControl from '../select-control';
import type { SelectControlProps } from '../select-control/types';

export type Truthy< T > = T extends false | '' | 0 | null | undefined
	? never
	: T;

export type SelectOptions = Required<
	ComponentProps< typeof SelectControl >
>[ 'options' ];

export interface Tree {
	id: string;
	name: string;
	children?: Tree[];
}

export interface TreeSelectProps extends Omit< SelectControlProps, 'value' > {
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
	selectedId?: ComponentProps< typeof SelectControl >[ 'value' ];
}
