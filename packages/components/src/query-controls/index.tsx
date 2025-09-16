/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AuthorSelect from './author-select';
import CategorySelect from './category-select';
import FormTokenField from '../form-token-field';
import RangeControl from '../range-control';
import SelectControl from '../select-control';
import { VStack } from '../v-stack';
import type {
	QueryControlsProps,
	QueryControlsWithMultipleCategorySelectionProps,
	QueryControlsWithSingleCategorySelectionProps,
	OrderByOption,
} from './types';

const DEFAULT_MIN_ITEMS = 1;
const DEFAULT_MAX_ITEMS = 100;
const MAX_CATEGORIES_SUGGESTIONS = 20;

function isSingleCategorySelection(
	props: QueryControlsProps
): props is QueryControlsWithSingleCategorySelectionProps {
	return 'categoriesList' in props;
}

function isMultipleCategorySelection(
	props: QueryControlsProps
): props is QueryControlsWithMultipleCategorySelectionProps {
	return 'categorySuggestions' in props;
}

const defaultOrderByOptions: OrderByOption[] = [
	{
		label: __( 'Newest to oldest' ),
		value: 'date/desc',
	},
	{
		label: __( 'Oldest to newest' ),
		value: 'date/asc',
	},
	{
		/* translators: Label for ordering posts by title in ascending order. */
		label: __( 'A → Z' ),
		value: 'title/asc',
	},
	{
		/* translators: Label for ordering posts by title in descending order. */
		label: __( 'Z → A' ),
		value: 'title/desc',
	},
];

/**
 * Controls to query for posts.
 *
 * ```jsx
 * const MyQueryControls = () => (
 *   <QueryControls
 *     { ...{ maxItems, minItems, numberOfItems, order, orderBy, orderByOptions } }
 *     onOrderByChange={ ( newOrderBy ) => {
 *       updateQuery( { orderBy: newOrderBy } )
 *     }
 *     onOrderChange={ ( newOrder ) => {
 *       updateQuery( { order: newOrder } )
 *     }
 *     categoriesList={ categories }
 *     selectedCategoryId={ category }
 *     onCategoryChange={ ( newCategory ) => {
 *       updateQuery( { category: newCategory } )
 *     }
 *     onNumberOfItemsChange={ ( newNumberOfItems ) => {
 *       updateQuery( { numberOfItems: newNumberOfItems } )
 *     } }
 *   />
 * );
 * ```
 */
export function QueryControls( {
	authorList,
	selectedAuthorId,
	numberOfItems,
	order,
	orderBy,
	orderByOptions = defaultOrderByOptions,
	maxItems = DEFAULT_MAX_ITEMS,
	minItems = DEFAULT_MIN_ITEMS,
	onAuthorChange,
	onNumberOfItemsChange,
	onOrderChange,
	onOrderByChange,
	// Props for single OR multiple category selection are not destructured here,
	// but instead are destructured inline where necessary.
	...props
}: QueryControlsProps ) {
	return (
		<VStack spacing="4" className="components-query-controls">
			{ [
				onOrderChange && onOrderByChange && (
					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						key="query-controls-order-select"
						label={ __( 'Order by' ) }
						value={
							orderBy === undefined || order === undefined
								? undefined
								: `${ orderBy }/${ order }`
						}
						options={ orderByOptions }
						onChange={ ( value ) => {
							if ( typeof value !== 'string' ) {
								return;
							}

							const [ newOrderBy, newOrder ] = value.split( '/' );
							if ( newOrder !== order ) {
								onOrderChange(
									newOrder as NonNullable<
										QueryControlsProps[ 'order' ]
									>
								);
							}
							if ( newOrderBy !== orderBy ) {
								onOrderByChange(
									newOrderBy as NonNullable<
										QueryControlsProps[ 'orderBy' ]
									>
								);
							}
						} }
					/>
				),
				isSingleCategorySelection( props ) &&
					props.categoriesList &&
					props.onCategoryChange && (
						<CategorySelect
							__next40pxDefaultSize
							key="query-controls-category-select"
							categoriesList={ props.categoriesList }
							label={ __( 'Category' ) }
							noOptionLabel={ _x( 'All', 'categories' ) }
							selectedCategoryId={ props.selectedCategoryId }
							onChange={ props.onCategoryChange }
						/>
					),
				isMultipleCategorySelection( props ) &&
					props.categorySuggestions &&
					props.onCategoryChange && (
						<FormTokenField
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							key="query-controls-categories-select"
							label={ __( 'Categories' ) }
							value={
								props.selectedCategories &&
								props.selectedCategories.map( ( item ) => ( {
									id: item.id,
									// Keeping the fallback to `item.value` for legacy reasons,
									// even if items of `selectedCategories` should not have a
									// `value` property.
									// @ts-expect-error
									value: item.name || item.value,
								} ) )
							}
							suggestions={ Object.keys(
								props.categorySuggestions
							) }
							onChange={ props.onCategoryChange }
							maxSuggestions={ MAX_CATEGORIES_SUGGESTIONS }
						/>
					),
				onAuthorChange && (
					<AuthorSelect
						__next40pxDefaultSize
						key="query-controls-author-select"
						authorList={ authorList }
						label={ __( 'Author' ) }
						noOptionLabel={ _x( 'All', 'authors' ) }
						selectedAuthorId={ selectedAuthorId }
						onChange={ onAuthorChange }
					/>
				),
				onNumberOfItemsChange && (
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						key="query-controls-range-control"
						label={ __( 'Number of items' ) }
						value={ numberOfItems }
						onChange={ onNumberOfItemsChange }
						min={ minItems }
						max={ maxItems }
						required
					/>
				),
			] }
		</VStack>
	);
}

export default QueryControls;
