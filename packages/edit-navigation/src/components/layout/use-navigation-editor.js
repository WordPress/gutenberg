/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';

export default function useNavigationEditor() {
	const menus = useSelect( ( select ) =>
		select( 'core' ).getMenus( { per_page: -1 } )
	);

	const [ selectedMenuId, setSelectedMenuId ] = useState( null );

	useEffect( () => {
		if ( ! selectedMenuId && menus?.length ) {
			setSelectedMenuId( menus[ 0 ].id );
		}
	}, [ selectedMenuId, menus ] );

	const navigationPost = useSelect( ( select ) =>
		select( 'core/edit-navigation' ).getNavigationPostForMenu(
			selectedMenuId
		)
	);

	const [ isAddingMenu, setIsAddingMenu ] = useState( false );

	const selectMenu = ( menuId ) => {
		setSelectedMenuId( menuId );
		setIsAddingMenu( false );
	};

	const beginAddingMenu = () => setIsAddingMenu( true );

	const cancelAddingMenu = () => setIsAddingMenu( false );

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
		selectedMenuId,
		navigationPost,
		isAddingMenu,
		selectMenu,
		beginAddingMenu,
		cancelAddingMenu,
		deleteMenu,
	};
}
