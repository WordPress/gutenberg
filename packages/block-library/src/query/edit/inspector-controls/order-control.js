/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const orderOptions = [
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
];
function OrderControl( { order, orderBy, onChange } ) {
	return (
		<SelectControl
			label={ __( 'Order by' ) }
			value={ `${ orderBy }/${ order }` }
			options={ orderOptions }
			onChange={ ( value ) => {
				const [ newOrderBy, newOrder ] = value.split( '/' );
				onChange( { order: newOrder, orderBy: newOrderBy } );
			} }
		/>
	);
}

export default OrderControl;
