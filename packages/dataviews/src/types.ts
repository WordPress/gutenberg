/**
 * External dependencies
 */
import type { ReactNode } from 'react';

interface Option {
	value: any;
	label: string;
}

interface filterByConfig {
	operators?: Operator[];
	isPrimary?: boolean;
}

type Operator = 'is' | 'isNot' | 'isAny' | 'isNone' | 'isAll' | 'isNotAll';

export type Item = Record< string, any >;

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
	width: string | number | undefined;

	/**
	 * The minimum width of the field column.
	 */
	maxWidth: string | number | undefined;

	/**
	 * The maximum width of the field column.
	 */
	minWidth: string | number | undefined;

	/**
	 * Whether the field is sortable.
	 */
	enableSorting: boolean | undefined;

	/**
	 * Whether the field is searchable.
	 */
	enableGlobalSearch: boolean | undefined;

	/**
	 * Whether the field is filterable.
	 */
	enableHiding: boolean | undefined;

	/**
	 * The list of options to pick from when using the field as a filter.
	 */
	elements: Option[] | undefined;

	/**
	 * Filter config for the field.
	 */
	filterBy: filterByConfig | undefined;
}

export type NormalizedField = Required< Field >;

export type Data = Item[];

export interface Filter {
	/**
	 * The field to filter by.
	 */
	field: string;

	/**
	 * The operator to use.
	 */
	operator: Operator;

	/**
	 * The value to filter by.
	 */
	value: any;
}

interface ViewBase {
	/**
	 * The layout of the view.
	 */
	type: string;

	/**
	 * The global search term.
	 */
	search?: string;

	/**
	 * The filters to apply.
	 */
	filters: Filter[];

	/**
	 * The sorting configuration.
	 */
	sort?: {
		/**
		 * The field to sort by.
		 */
		field: string;

		/**
		 * The direction to sort by.
		 */
		direction: string;
	};

	/**
	 * The active page
	 */
	page?: number;

	/**
	 * The number of items per page
	 */
	perPage?: number;

	/**
	 * The hidden fields.
	 */
	hiddenFields: string[];
}
export interface ViewList extends ViewBase {
	type: 'list';

	layout: {
		/**
		 * The field to use as the primary field.
		 */
		primaryField: string;

		/**
		 * The field to use as the media field.
		 */
		mediaField: string;
	};
}

export type View = ViewList | ViewBase;
