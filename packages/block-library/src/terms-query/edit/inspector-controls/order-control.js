/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';

export default function OrderControl( { orderBy, order, onChange, ...props } ) {
	return (
		<SelectControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			options={ [
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
			] }
			value={ orderBy + '/' + order }
			onChange={ ( value ) => {
				const [ newOrderBy, newOrder ] = value.split( '/' );
				onChange( newOrderBy, newOrder );
			} }
			{ ...props }
		/>
	);
}
