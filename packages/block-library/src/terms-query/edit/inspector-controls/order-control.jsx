import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/ui';

export default function OrderControl( {
	orderBy,
	order,
	onChange,
	help,
	...props
} ) {
	const orderOptions = [
		{
			label: __( 'Name: A → Z' ),
			value: 'name/asc',
		},
		{
			label: __( 'Name: Z → A' ),
			value: 'name/desc',
		},
		{
			label: __( 'Count, high to low' ),
			value: 'count/desc',
		},
		{
			label: __( 'Count, low to high' ),
			value: 'count/asc',
		},
	];
	return (
		<SelectControl
			items={ orderOptions }
			value={
				orderOptions.find(
					( item ) => item.value === orderBy + '/' + order
				) ?? null
			}
			onValueChange={ ( item ) => {
				if ( ! item ) {
					return;
				}
				const [ newOrderBy, newOrder ] = item.value.split( '/' );
				onChange( newOrderBy, newOrder );
			} }
			description={ help }
			{ ...props }
		/>
	);
}
