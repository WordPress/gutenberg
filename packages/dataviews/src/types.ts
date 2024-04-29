/**
 * External dependencies
 */
import type { ReactNode } from 'react';

type Item = Record< string, any >;

interface Option {
	value: any;
	label: string;
}

interface filterByConfig {
	operators?: string[];
	isPrimary?: boolean;
}

export interface Field {
	/**
	 * The unique identifier of the field.
	 */
	id: string;

	/**
	 * The label of the field. Defaults to the id.
	 */
	header?: string;

	/**
	 * Callback used to retrieve the value of the field from the item.
	 * Defaults to `item[ field.id ]`.
	 */
	getValue?: ( { item }: { item: Item } ) => any;

	/**
	 * Callback used to render the field. Defaults to `field.getValue`.
	 */
	render?: ( { item }: { item: Item } ) => ReactNode;

	/**
	 * The width of the field column.
	 */
	width?: string | number;

	/**
	 * The minimum width of the field column.
	 */
	maxWidth?: string | number;

	/**
	 * The maximum width of the field column.
	 */
	minWidth?: string | number;

	/**
	 * Whether the field is sortable.
	 */
	enableSorting?: boolean;

	/**
	 * Whether the field is searchable.
	 */
	enableGlobalSearch?: boolean;

	/**
	 * Whether the field is filterable.
	 */
	enableHiding?: boolean;

	/**
	 * The list of options to pick from when using the field as a filter.
	 */
	elements?: Option[];

	/**
	 * Filter config for the field.
	 */
	filterBy?: filterByConfig;
}
