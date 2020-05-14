/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';

export default function useMenus() {
	const wpMenus = useSelect( ( select ) => select( 'core' ).getMenus() );

	const [ currentMenu, setCurrentMenu ] = useState( 0 );
	const [ menus, setMenus ] = useState( null );

	useEffect( () => {
		if ( wpMenus?.length ) {
			setMenus( wpMenus );
			setCurrentMenu( wpMenus[ 0 ].id );
		}
	}, [ wpMenus ] );

	return [ menus, setMenus, currentMenu, setCurrentMenu ];
}
