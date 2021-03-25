/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { store as editNavigationStore } from '../store';

const getMenusData = ( select ) => {
	const selectors = select( 'core' );
	const params = { per_page: -1 };
	return {
		menus: selectors.getMenus( params ),
		hasLoadedMenus: selectors.hasFinishedResolution( 'getMenus', [
			params,
		] ),
	};
};
export default function useNavigationEditor() {
	const [
		isManageLocationsModalOpen,
		setIsManageLocationsModalOpen,
	] = useState( false );
	const [ openManageLocationsModal, closeManageLocationsModal ] = [
		true,
		false,
	].map( ( bool ) => () => setIsManageLocationsModalOpen( bool ) );
	const { deleteMenu: _deleteMenu } = useDispatch( 'core' );
	const [ selectedMenuId, setSelectedMenuId ] = useState( null );
	const [ hasFinishedInitialLoad, setHasFinishedInitialLoad ] = useState(
		false
	);

	const { menus, hasLoadedMenus } = useSelect( getMenusData, [] );
	useEffect( () => {
		if ( hasLoadedMenus ) {
			setHasFinishedInitialLoad( true );
		}
	}, [ hasLoadedMenus ] );

	useEffect( () => {
		if ( ! selectedMenuId && menus?.length ) {
			setSelectedMenuId( menus[ 0 ].id );
		}
	}, [ selectedMenuId, menus ] );

	const navigationPost = useSelect(
		( select ) => {
			if ( ! selectedMenuId ) {
				return;
			}
			return select( editNavigationStore ).getNavigationPostForMenu(
				selectedMenuId
			);
		},
		[ selectedMenuId ]
	);

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
		selectMenu: setSelectedMenuId,
		deleteMenu,
		hasFinishedInitialLoad,
		hasLoadedMenus,
		openManageLocationsModal,
		closeManageLocationsModal,
		isManageLocationsModalOpen,
	};
}
