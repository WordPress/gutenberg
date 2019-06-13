/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { RangeControl, SelectControl } from '../';
import CategorySelect from './category-select';
import AuthorSelect from './author-select';

const DEFAULT_MIN_ITEMS = 1;
const DEFAULT_MAX_ITEMS = 100;

export default function QueryControls( {
	categoriesList,
	authorList,
	selectedCategoryId,
	selectedAuthorId,
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
		( onOrderChange && onOrderByChange ) && (
			<SelectControl
				key="query-controls-order-select"
				label={ __( 'Order by' ) }
				value={ `${ orderBy }/${ order }` }
				options={ [
					{
						label: __( 'Newest to Oldest' ),
						value: 'date/desc',
					},
					{
						label: __( 'Oldest to Newest' ),
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
		onCategoryChange && (
			<CategorySelect
				key="query-controls-category-select"
				categoriesList={ categoriesList }
				label={ __( 'Category' ) }
				noOptionLabel={ __( 'All' ) }
				selectedCategoryId={ selectedCategoryId }
				onChange={ onCategoryChange }
			/> ),
		onAuthorChange && (
			<AuthorSelect
				key="query-controls-author-select"
				authorList={ authorList }
				label={ __( 'Author' ) }
				noOptionLabel={ __( 'All' ) }
				selectedAuthorId={ selectedAuthorId }
				onChange={ onAuthorChange }
			/> ),
		onNumberOfItemsChange && (
			<RangeControl
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
