/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editNavigationStore } from '../../store';

export default function useNavigationEditor() {
	const [ hasFinishedInitialLoad, setHasFinishedInitialLoad ] = useState(
		false
	);
	const { menus, hasLoadedMenus } = useSelect( ( select ) => {
		const selectors = select( 'core' );
		const params = { per_page: -1 };
		return {
			menus: selectors.getMenus( params ),
			hasLoadedMenus: selectors.hasFinishedResolution( 'getMenus', [
				params,
			] ),
		};
	}, [] );

	useEffect( () => {
		if ( hasLoadedMenus ) {
			setHasFinishedInitialLoad( true );
		}
	}, [ hasLoadedMenus ] );

	const [ selectedMenuId, setSelectedMenuId ] = useState( null );

	useEffect( () => {
		if ( ! selectedMenuId && menus?.length ) {
			setSelectedMenuId( menus[ 0 ].id );
		}
	}, [ selectedMenuId, menus ] );

	const navigationPost = useSelect(
		( select ) =>
			select( editNavigationStore ).getNavigationPostForMenu(
				selectedMenuId
			),
		[ selectedMenuId ]
	);

	const selectMenu = ( menuId ) => {
		setSelectedMenuId( menuId );
	};

	const { deleteMenu: _deleteMenu } = useDispatch( 'core' );

	const deleteMenu = async () => {
		const didDeleteMenu = await _deleteMenu( selectedMenuId, {
			force: true,
		} );
		if ( didDeleteMenu ) {
			setSelectedMenuId( null );
		}
	};

	return {
		menus,
		hasLoadedMenus,
		hasFinishedInitialLoad,
		selectedMenuId,
		navigationPost,
		selectMenu,
		deleteMenu,
	};
}
