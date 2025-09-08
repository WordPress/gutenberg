/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	SelectControl,
} from '@wordpress/components';

export default function OrderByControl( { termQuery, setQuery } ) {
	return (
		<ToolsPanelItem
			hasValue={ () => termQuery.orderBy !== 'name' }
			label={ __( 'Order by' ) }
			onDeselect={ () => setQuery( { orderBy: 'name' } ) }
			isShownByDefault
		>
			<SelectControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Order by' ) }
				options={ [
					{ label: __( 'Name' ), value: 'name' },
					{ label: __( 'Slug' ), value: 'slug' },
					{ label: __( 'Count' ), value: 'count' },
				] }
				value={ termQuery.orderBy }
				onChange={ ( orderBy ) => setQuery( { orderBy } ) }
			/>
		</ToolsPanelItem>
	);
}
