/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { SelectControl } from '@wordpress/components';

export default function MenuSelectControl( {
	location,
	availableMenuIds,
	onSelectMenu,
} ) {
	const [ selectedMenuId, setSelectedMenuId ] = useState( location.menu );

	return (
		<SelectControl
			options={ availableMenuIds }
			value={ selectedMenuId }
			onChange={ ( newMenuId ) => {
				onSelectMenu( selectedMenuId, {
					newLocation: location.name,
					newMenuId,
				} );
				setSelectedMenuId( newMenuId );
			} }
		/>
	);
}
