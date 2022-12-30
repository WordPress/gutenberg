/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CategorySelect from './category-select';
import { RangeControl, SelectControl, FormTokenField } from '../';
import AuthorSelect from './author-select';

const DEFAULT_MIN_ITEMS = 1;
const DEFAULT_MAX_ITEMS = 100;
const MAX_CATEGORIES_SUGGESTIONS = 20;

export default function QueryControls( {
	authorList,
	selectedAuthorId,
	categoriesList,
	selectedCategoryId,
	categorySuggestions,
	selectedCategories,
	numberOfItems,
	order,
	orderBy,
	maxItems = DEFAULT_MAX_ITEMS,
	minItems = DEFAULT_MIN_ITEMS,
	onCategoryChange,
	onAuthorChange,
	onNumberOfItemsChange,
	onOrderChange,
	onOrderByChange,
} ) {
	return [
		onOrderChange && onOrderByChange && (
			<SelectControl
				key="query-controls-order-select"
				label={ __( 'Order by' ) }
				value={ `${ orderBy }/${ order }` }
				options={ [
					{
						label: __( 'Newest to oldest' ),
						value: 'date/desc',
					},
					{
						label: __( 'Oldest to newest' ),
						value: 'date/asc',
					},
					{
						/* translators: label for ordering posts by title in ascending order */
						label: __( 'A → Z' ),
						value: 'title/asc',
					},
					{
						/* translators: label for ordering posts by title in descending order */
						label: __( 'Z → A' ),
						value: 'title/desc',
					},
				] }
				onChange={ ( value ) => {
					const [ newOrderBy, newOrder ] = value.split( '/' );
					if ( newOrder !== order ) {
						onOrderChange( newOrder );
					}
					if ( newOrderBy !== orderBy ) {
						onOrderByChange( newOrderBy );
					}
				} }
			/>
		),
		categoriesList && onCategoryChange && (
			<CategorySelect
				key="query-controls-category-select"
				categoriesList={ categoriesList }
				label={ __( 'Category' ) }
				noOptionLabel={ __( 'All' ) }
				selectedCategoryId={ selectedCategoryId }
				onChange={ onCategoryChange }
			/>
		),
		categorySuggestions && onCategoryChange && (
			<FormTokenField
				key="query-controls-categories-select"
				label={ __( 'Categories' ) }
				value={
					selectedCategories &&
					selectedCategories.map( ( item ) => ( {
						id: item.id,
						value: item.name || item.value,
					} ) )
				}
				suggestions={ Object.keys( categorySuggestions ) }
				onChange={ onCategoryChange }
				maxSuggestions={ MAX_CATEGORIES_SUGGESTIONS }
			/>
		),
		onAuthorChange && (
			<AuthorSelect
				key="query-controls-author-select"
				authorList={ authorList }
				label={ __( 'Author' ) }
				noOptionLabel={ __( 'All' ) }
				selectedAuthorId={ selectedAuthorId }
				onChange={ onAuthorChange }
			/>
		),
		onNumberOfItemsChange && (
			<RangeControl
				__nextHasNoMarginBottom
				key="query-controls-range-control"
				label={ __( 'Number of items' ) }
				value={ numberOfItems }
				onChange={ onNumberOfItemsChange }
				min={ minItems }
				max={ maxItems }
				required
			/>
		),
	];
}
