/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useCallback, memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { RangeControl, SelectControl } from '../';
import CategorySelect from './category-select';

const DEFAULT_MIN_ITEMS = 1;
const DEFAULT_MAX_ITEMS = 100;

const options = [
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

const QueryControls = memo(
	( {
		categoriesList,
		selectedCategoryId,
		numberOfItems,
		order,
		orderBy,
		maxItems = DEFAULT_MAX_ITEMS,
		minItems = DEFAULT_MIN_ITEMS,
		onCategoryChange,
		onNumberOfItemsChange,
		onOrderChange,
		onOrderByChange,
	} ) => {
		const onChange = useCallback(
			( value ) => {
				const [ newOrderBy, newOrder ] = value.split( '/' );
				if ( newOrder !== order ) {
					onOrderChange( newOrder );
				}
				if ( newOrderBy !== orderBy ) {
					onOrderByChange( newOrderBy );
				}
			},
			[ order, orderBy, onOrderByChange, onOrderChange ]
		);

		return (
			<>
				{ onOrderChange && onOrderByChange && (
					<SelectControl
						label={ __( 'Order by' ) }
						value={ `${ orderBy }/${ order }` }
						options={ options }
						onChange={ onChange }
						hideCancelButton
					/>
				) }
				{ onCategoryChange && (
					<CategorySelect
						categoriesList={ categoriesList }
						label={ __( 'Category' ) }
						noOptionLabel={ _x( 'All', 'categories' ) }
						selectedCategoryId={ selectedCategoryId }
						onChange={ onCategoryChange }
						hideCancelButton
					/>
				) }
				{ onNumberOfItemsChange && (
					<RangeControl
						__next40pxDefaultSize
						label={ __( 'Number of items' ) }
						value={ numberOfItems }
						onChange={ onNumberOfItemsChange }
						min={ minItems }
						max={ maxItems }
						required
					/>
				) }
			</>
		);
	}
);

export default QueryControls;
