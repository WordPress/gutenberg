/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo, useEffect, useState } from '@wordpress/element';

export function useMenuItemsQuery( menuId ) {
	const query = useMemo( () => ( { menus: menuId, per_page: -1 } ), [
		menuId,
	] );
	return query;
}

export default function useMenuItems( query ) {
	const { menuItems, isResolving } = useSelect( ( select ) => ( {
		menuItems: select( 'core' ).getMenuItems( query ),
		isResolving: select( 'core/data' ).isResolving(
			'core',
			'getMenuItems',
			[ query ]
		),
	} ) );

	const [ resolvedMenuItems, setResolvedMenuItems ] = useState( null );

	useEffect( () => {
		if ( isResolving || menuItems === null ) {
			return;
		}

		setResolvedMenuItems( menuItems );
	}, [ isResolving, menuItems ] );

	return resolvedMenuItems;
}
