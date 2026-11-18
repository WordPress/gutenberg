import { SelectControl } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';

const defaultOrderByOptions = [
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

function OrderControl( {
	order,
	orderBy,
	orderByOptions = defaultOrderByOptions,
	onChange,
} ) {
	return (
		<SelectControl
			label={ __( 'Order by' ) }
			value={
				orderByOptions.find(
					( item ) => item.value === `${ orderBy }/${ order }`
				) ??
				orderByOptions[ 0 ] ??
				null
			}
			items={ orderByOptions }
			onValueChange={ ( item ) => {
				if ( ! item || item.value === `${ orderBy }/${ order }` ) {
					return;
				}
				const [ newOrderBy, newOrder ] = item.value.split( '/' );
				onChange( { order: newOrder, orderBy: newOrderBy } );
			} }
		/>
	);
}

export default OrderControl;
