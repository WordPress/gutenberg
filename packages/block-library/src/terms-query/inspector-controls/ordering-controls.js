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
		<>
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
		</>
	);
}
