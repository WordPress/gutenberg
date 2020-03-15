/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { RangeControl, SelectControl, FormTokenField } from '../';

const DEFAULT_MIN_ITEMS = 1;
const DEFAULT_MAX_ITEMS = 100;
const MAX_CATEGORIES_SUGGESTIONS = 20;

// currently this is needed for consistent controls UI on mobile
// this can be removed after control components settle on consistent defaults
const MOBILE_CONTROL_PROPS = Platform.select( {
	web: {},
	native: { separatorType: 'fullWidth' },
} );
const MOBILE_CONTROL_PROPS_SEPARATOR_NONE = Platform.select( {
	web: {},
	native: { separatorType: 'none' },
} );

export default function QueryControls( {
	categorySuggestions,
	selectedCategories,
	numberOfItems,
	order,
	orderBy,
	maxItems = DEFAULT_MAX_ITEMS,
	minItems = DEFAULT_MIN_ITEMS,
	onCategoryChange,
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
				{ ...MOBILE_CONTROL_PROPS }
			/>
		),
		onCategoryChange && (
			<FormTokenField
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

		onNumberOfItemsChange && (
			<RangeControl
				key="query-controls-range-control"
				label={ __( 'Number of items' ) }
				value={ numberOfItems }
				onChange={ onNumberOfItemsChange }
				min={ minItems }
				max={ maxItems }
				required
				{ ...MOBILE_CONTROL_PROPS_SEPARATOR_NONE }
			/>
		),
	];
}
