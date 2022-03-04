/**
 * WordPress dependencies
 */
import { useRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useCreateNavigationMenu from './use-create-navigation-menu';
import menuItemsToBlocks from '../menu-items-to-blocks';

const CLASSIC_MENU_CONVERSION_SUCCESS = 'success';
const CLASSIC_MENU_CONVERSION_ERROR = 'error';
const CLASSIC_MENU_CONVERSION_PENDING = 'pending';

function useConvertClassicToBlockMenu( clientId ) {
	const createNavigationMenu = useCreateNavigationMenu( clientId );
	const registry = useRegistry();

	const [ status, setStatus ] = useState( 'idle' );
	const [ value, setValue ] = useState( null );
	const [ error, setError ] = useState( null );

	async function convertClassicMenuToBlockMenu( menuId, menuName ) {
		let navigationMenu;
		let classicMenuItems;

		const menuItemsParameters = {
			menus: menuId,
			per_page: -1,
			context: 'view',
		};

		const fetchError = new Error(
			sprintf(
				// translators: %s: the name of a menu (e.g. Header navigation).
				__( `Unable to fetch classic menu "%s" from API.` ),
				menuName
			),
			{
				menuId,
				menuName,
			}
		);

		// 1. Fetch the classic Menu items.
		try {
			classicMenuItems = await registry
				.resolveSelect( coreStore )
				.getMenuItems( menuItemsParameters );
		} catch ( e ) {
			throw fetchError;
		}

		// Handle offline response which resolves to `null`.
		if ( classicMenuItems === null ) {
			throw fetchError;
		}

		// 2. Convert the classic items into blocks.
		const { innerBlocks } = menuItemsToBlocks( classicMenuItems );

		// 3. Create the `wp_navigation` Post with the blocks.
		try {
			navigationMenu = await createNavigationMenu(
				menuName,
				innerBlocks
			);
		} catch ( e ) {
			throw new Error(
				sprintf(
					// translators: %s: the name of a menu (e.g. Header navigation).
					__( `Unable to create Navigation Menu "%s".` ),
					menuName
				),
				{
					menuId,
					menuName,
				}
			);
		}

		return navigationMenu;
	}

	const convert = useCallback(
		( menuId, menuName ) => {
			if ( ! menuId || ! menuName ) {
				setError( 'Unable to convert menu. Missing menu details.' );
				setStatus( CLASSIC_MENU_CONVERSION_ERROR );
				return;
			}

			setStatus( CLASSIC_MENU_CONVERSION_PENDING );
			setValue( null );
			setError( null );

			convertClassicMenuToBlockMenu( menuId, menuName )
				.then( ( navMenu ) => {
					setValue( navMenu );
					setStatus( CLASSIC_MENU_CONVERSION_SUCCESS );
				} )
				.catch( ( e ) => {
					setError( e?.message );
					setStatus( CLASSIC_MENU_CONVERSION_ERROR );
				} );
		},
		[ clientId ]
	);

	return {
		convert,
		status,
		value,
		error,
	};
}

export default useConvertClassicToBlockMenu;
