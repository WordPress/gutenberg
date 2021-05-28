/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editNavigationStore } from '../store';
import { useSelectedMenuId } from './index';

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
	const { deleteMenu: _deleteMenu } = useDispatch( coreStore );
	const [ selectedMenuId, setSelectedMenuId ] = useSelectedMenuId();
	const [ hasFinishedInitialLoad, setHasFinishedInitialLoad ] = useState(
		false
	);
	const { menus, hasLoadedMenus } = useSelect( getMenusData, [] );

	const { createErrorNotice, createInfoNotice } = useDispatch( noticesStore );
	const isMenuBeingDeleted = useSelect(
		( select ) =>
			select( coreStore ).isDeletingEntityRecord(
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
			setSelectedMenuId( 0 );
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

	return {
		menus,
		hasLoadedMenus,
		hasFinishedInitialLoad,
		selectedMenuId,
		navigationPost,
		isMenuBeingDeleted,
		selectMenu: setSelectedMenuId,
		deleteMenu,
		isMenuSelected: !! selectedMenuId,
	};
}
