/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	SelectControl,
} from '@wordpress/components';

export default function OrderControl( { termQuery, setQuery } ) {
	return (
		<ToolsPanelItem
			hasValue={ () => termQuery.order !== 'asc' }
			label={ __( 'Order' ) }
			onDeselect={ () => setQuery( { order: 'asc' } ) }
			isShownByDefault
		>
			<SelectControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Order' ) }
				options={ [
					{ label: __( 'Ascending' ), value: 'asc' },
					{ label: __( 'Descending' ), value: 'desc' },
				] }
				value={ termQuery.order }
				onChange={ ( order ) => setQuery( { order } ) }
			/>
		</ToolsPanelItem>
	);
}
