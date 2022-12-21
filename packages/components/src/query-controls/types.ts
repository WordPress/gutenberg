/**
 * External dependencies
 */
import type { Key } from 'react';

/**
 * Internal dependencies
 */
import type { FormTokenFieldProps } from '../form-token-field/types';
import type { Tree, TreeSelectProps } from '../tree-select/types';

export type Term = {
	id: Tree[ 'id' ];
	name: Tree[ 'name' ];
	parent?: number | null;
	value?: string;
};

export type TermsWithChildren = Array< Term & { children: Term[] } >;

export type CategorySelectProps = {
	categoriesList: Term[];
	key: Key;
	label: TreeSelectProps[ 'label' ];
	noOptionLabel: TreeSelectProps[ 'noOptionLabel' ];
	onChange: TreeSelectProps[ 'onChange' ];
	selectedCategoryId?: Term[ 'id' ];
};

export type AuthorSelectProps = {
	authorList?: Term[];
	label: TreeSelectProps[ 'label' ];
	noOptionLabel: TreeSelectProps[ 'noOptionLabel' ];
	onChange: TreeSelectProps[ 'onChange' ];
	selectedAuthorId?: string;
};

export type QueryControlsProps = {
	/**
	 * An array of terms with author IDs that is passed into
	 * an `AuthorSelect` sub-component.
	 */
	authorList?: AuthorSelectProps[ 'authorList' ];
	/**
	 * An array of categoris with their IDs; renders a `CategorySelect`
	 * sub-component when passed in conjunction with `onCategoryChange`.
	 */
	categoriesList?: CategorySelectProps[ 'categoriesList' ];
	/**
	 * An array of category names; renders a `FormTokenField` component
	 * when passed in conjunction with `onCategoryChange`.
	 */
	categorySuggestions?: Term[ 'name' ][];
	/**
	 * The maximum items.
	 *
	 * @default 100
	 */
	maxItems?: number;
	/**
	 * The minimum of items.
	 *
	 * @default 1
	 */
	minItems?: number;
	/**
	 * The selected number of items to retrieve via the query.
	 */
	numberOfItems?: number;
	/**
	 * A function that receives the new author value.
	 * If this is not specified, the author controls are not included.
	 */
	onAuthorChange?: AuthorSelectProps[ 'onChange' ];
	/**
	 * A function that receives the new category value.
	 * If this is not specified, the category controls are not included.
	 */
	onCategoryChange?: CategorySelectProps[ 'onChange' ] &
		FormTokenFieldProps[ 'onChange' ];
	/**
	 * A function that receives the new number of items value.
	 * If this is not specified, then the number of items
	 * range control is not included.
	 */
	onNumberOfItemsChange?: ( newNumber?: number ) => void;
	/**
	 * A function that receives the new order value.
	 * If this or onOrderByChange are not specified,
	 * then the order controls are not included.
	 */
	onOrderChange?: ( newOrder: string ) => void;
	/**
	 * A function that receives the new orderby value.
	 * If this or onOrderChange are not specified,
	 * then the order controls are not included.
	 */
	onOrderByChange?: ( newOrderBy: string ) => void;
	/**
	 * The order in which to retrieve posts. Can be 'asc' or 'desc'.
	 */
	order?: 'asc' | 'desc';
	/**
	 * The meta key by which to order posts. Can be 'date' or 'title'.
	 */
	orderBy?: 'data' | 'title';
	/**
	 * The selected author ID.
	 */
	selectedAuthorId?: AuthorSelectProps[ 'selectedAuthorId' ];
	/**
	 * The selected categories for the `categorySuggestions`.
	 */
	selectedCategories?: Term[];
	/**
	 * The selected category for the `categoriesList`.
	 */
	selectedCategoryId?: CategorySelectProps[ 'selectedCategoryId' ];
};
