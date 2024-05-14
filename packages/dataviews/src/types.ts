/**
 * External dependencies
 */
import type { ReactElement, ReactNode } from 'react';

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

interface ActionBase {
	/**
	 * The unique identifier of the action.
	 */
	id: string;

	/**
	 * The label of the action.
	 */
	label: string;

	/**
	 * The icon of the action. (Either a string or an SVG element)
	 * This should be IconType from the components package
	 * but that import is breaking typescript build for the moment.
	 */
	icon?: any;

	/**
	 * Whether the action is disabled.
	 */
	disabled?: boolean;

	/**
	 * Whether the action is destructive.
	 */
	isDestructive?: boolean;

	/**
	 * Whether the action is a primary action.
	 */
	isPrimary?: boolean;

	/**
	 * Whether the item passed as an argument supports the current action.
	 */
	isEligible?: ( item: Item ) => boolean;

	/**
	 * Whether the action can be used as a bulk action.
	 */
	supportsBulk?: boolean;
}

export interface ActionModal extends ActionBase {
	/**
	 * Modal to render when the action is triggered.
	 */
	RenderModal: ( {
		items,
		closeModal,
		onActionStart,
		onActionPerformed,
	}: {
		items: Item[];
		closeModal?: () => void;
		onActionStart?: ( items: Item[] ) => void;
		onActionPerformed?: ( items: Item[] ) => void;
	} ) => ReactElement;

	/**
	 * Whether to hide the modal header.
	 */
	hideModalHeader?: boolean;

	/**
	 * The header of the modal.
	 */
	modalHeader?: string;
}

export interface ActionButton extends ActionBase {
	/**
	 * The callback to execute when the action is triggered.
	 */
	callback: ( items: Item[] ) => void;
}

export type Action = ActionModal | ActionButton;
