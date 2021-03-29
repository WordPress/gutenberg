/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { store as editNavigationStore } from '../store';
import { store as noticesStore } from '@wordpress/notices';
import { __, sprintf } from '@wordpress/i18n';

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
	const [ isMenuSelected, setIsMenuSelected ] = useState( true );

	const { createErrorNotice, createInfoNotice } = useDispatch( noticesStore );
	const isMenuBeingDeleted = useSelect(
		( select ) =>
			select( 'core' ).isDeletingEntityRecord(
				'root',
				'menu',
				selectedMenuId
			),
		[ selectedMenuId ]
	);
	const selectedMenuName =
		menus?.find( ( { id } ) => id === selectedMenuId )?.name || '';

	useEffect( () => {
		if ( hasLoadedMenus ) {
			setHasFinishedInitialLoad( true );
		}
	}, [ hasLoadedMenus ] );

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
			createInfoNotice(
				sprintf(
					// translators: %s: the name of a menu.
					__( '"%s" menu has been deleted' ),
					selectedMenuName
				),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);
		} else {
			createErrorNotice( __( 'Menu deletion unsuccessful' ) );
		}
	};

	useEffect( () => setIsMenuSelected( selectedMenuId !== null ), [
		selectedMenuId,
	] );
	return {
		menus,
		hasLoadedMenus,
		hasFinishedInitialLoad,
		selectedMenuId,
		navigationPost,
		isMenuBeingDeleted,
		selectMenu: setSelectedMenuId,
		deleteMenu,
		openManageLocationsModal,
		closeManageLocationsModal,
		isManageLocationsModalOpen,
		isMenuSelected,
	};
}
