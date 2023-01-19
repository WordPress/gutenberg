/**
 * Internal dependencies
 */
import type { FormTokenFieldProps } from '../form-token-field/types';
import type { TreeSelectProps } from '../tree-select/types';

export type Entity = {
	id: number;
	name: string;
	parent?: number | null;
	value?: string;
};

export type EntityForTree = Omit< Entity, 'id' > & {
	id: string;
};

export type TermsWithChildren = Array<
	EntityForTree & { children: EntityForTree[] }
>;

export type CategorySelectProps = Pick<
	TreeSelectProps,
	'label' | 'noOptionLabel'
> & {
	categoriesList: Entity[];
	onChange: ( newCategory: string ) => void;
	selectedCategoryId?: Entity[ 'id' ];
};

export type AuthorSelectProps = Pick<
	TreeSelectProps,
	'label' | 'noOptionLabel'
> & {
	authorList?: Entity[];
	onChange: ( newAuthor: string ) => void;
	selectedAuthorId?: Entity[ 'id' ];
};

type Order = 'asc' | 'desc';
type OrderBy = 'date' | 'title';

type BaseQueryControlsProps = {
	/**
	 * An array of authors that is passed into
	 * an `AuthorSelect` sub-component.
	 */
	authorList?: AuthorSelectProps[ 'authorList' ];
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
	onOrderChange?: ( newOrder: Order ) => void;
	/**
	 * A function that receives the new orderby value.
	 * If this or onOrderChange are not specified,
	 * then the order controls are not included.
	 */
	onOrderByChange?: ( newOrderBy: OrderBy ) => void;
	/**
	 * The order in which to retrieve posts.
	 */
	order?: Order;
	/**
	 * The meta key by which to order posts.
	 */
	orderBy?: OrderBy;
	/**
	 * The selected author ID.
	 */
	selectedAuthorId?: AuthorSelectProps[ 'selectedAuthorId' ];
};

export type QueryControlsWithSingleCategorySelectionProps =
	BaseQueryControlsProps & {
		/**
		 * An array of categories, renders a `CategorySelect`
		 * sub-component when passed in conjunction with `onCategoryChange`.
		 */
		categoriesList?: CategorySelectProps[ 'categoriesList' ];
		/**
		 * The selected category for the `categoriesList`.
		 */
		selectedCategoryId?: CategorySelectProps[ 'selectedCategoryId' ];
		/**
		 * A function that receives the new category value.
		 * If this is not specified, the category controls are not included.
		 */
		onCategoryChange?: CategorySelectProps[ 'onChange' ];
	};

export type QueryControlsWithMultipleCategorySelectionProps =
	BaseQueryControlsProps & {
		/**
		 * An array of category names, renders a `FormTokenField` component
		 * when passed in conjunction with `onCategoryChange`.
		 */
		categorySuggestions?: { [ categoryName: Entity[ 'name' ] ]: Entity };
		/**
		 * The selected categories for the `categorySuggestions`.
		 */
		selectedCategories?: Array<
			Omit< Entity, 'name' > & {
				name?: string;
				value: string;
			}
		>;
		/**
		 * A function that receives the new category value.
		 * If this is not specified, the category controls are not included.
		 */
		onCategoryChange?: FormTokenFieldProps[ 'onChange' ];
	};

export type QueryControlsProps =
	| QueryControlsWithSingleCategorySelectionProps
	| QueryControlsWithMultipleCategorySelectionProps;
