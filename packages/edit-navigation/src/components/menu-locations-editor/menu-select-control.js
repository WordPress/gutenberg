/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { SelectControl } from '@wordpress/components';

export default function MenuSelectControl( {
	location,
	availableMenuIds,
	onSelectMenu,
} ) {
	const [ selectedMenuId, setSelectedMenuId ] = useState( undefined );

	useEffect( () => {
		setSelectedMenuId( location.menu );
	}, [ location.menu ] );

	return (
		<SelectControl
			options={ availableMenuIds }
			value={ selectedMenuId }
			onChange={ ( newMenuId ) => {
				onSelectMenu( selectedMenuId, {
					newLocation: location.name,
					newMenuId: parseInt( newMenuId ),
				} );
				setSelectedMenuId( newMenuId );
			} }
		/>
	);
}
