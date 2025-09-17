/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	SelectControl,
} from '@wordpress/components';

export default function OrderingControls( { attributes, setQuery } ) {
	const { termQuery } = attributes;

	return (
		<ToolsPanelItem
			hasValue={ () =>
				termQuery.orderBy !== 'name' || termQuery.order !== 'asc'
			}
			label={ __( 'Order by' ) }
			onDeselect={ () => setQuery( { orderBy: 'name', order: 'asc' } ) }
			isShownByDefault
		>
			<SelectControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Order by' ) }
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
				value={ termQuery.orderBy + '/' + termQuery.order }
				onChange={ ( orderBy ) => {
					const [ newOrderBy, newOrder ] = orderBy.split( '/' );
					setQuery( {
						orderBy: newOrderBy,
						order: newOrder,
					} );
				} }
			/>
		</ToolsPanelItem>
	);
}
