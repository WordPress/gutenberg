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
const CLASSIC_MENU_CONVERSION_IDLE = 'idle';

function useConvertClassicToBlockMenu( clientId ) {
	const createNavigationMenu = useCreateNavigationMenu( clientId );
	const registry = useRegistry();

	const [ status, setStatus ] = useState( CLASSIC_MENU_CONVERSION_IDLE );
	const [ value, setValue ] = useState( null );
	const [ error, setError ] = useState( null );

	async function convertClassicMenuToBlockMenu( menuId, menuName ) {
		let navigationMenu;
		let classicMenuItems;

		// 1. Fetch the classic Menu items.
		try {
			classicMenuItems = await registry
				.resolveSelect( coreStore )
				.getMenuItems( {
					menus: menuId,
					per_page: -1,
					context: 'view',
				} );
		} catch ( err ) {
			throw new Error(
				sprintf(
					// translators: %s: the name of a menu (e.g. Header navigation).
					__( `Unable to fetch classic menu "%s" from API.` ),
					menuName
				),
				{
					cause: err,
				}
			);
		}

		// Handle offline response which resolves to `null`.
		if ( classicMenuItems === null ) {
			throw new Error(
				sprintf(
					// translators: %s: the name of a menu (e.g. Header navigation).
					__( `Unable to fetch classic menu "%s" from API.` ),
					menuName
				)
			);
		}

		// 2. Convert the classic items into blocks.
		const { innerBlocks } = menuItemsToBlocks( classicMenuItems );

		// 3. Create the `wp_navigation` Post with the blocks.
		try {
			navigationMenu = await createNavigationMenu(
				menuName,
				innerBlocks
			);
		} catch ( err ) {
			throw new Error(
				sprintf(
					// translators: %s: the name of a menu (e.g. Header navigation).
					__( `Unable to create Navigation Menu "%s".` ),
					menuName
				),
				{
					cause: err,
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
				.catch( ( err ) => {
					setError( err?.message );
					setStatus( CLASSIC_MENU_CONVERSION_ERROR );

					// Rethrow error for debugging.
					throw new Error(
						sprintf(
							// translators: %s: the name of a menu (e.g. Header navigation).
							__( `Unable to create Navigation Menu "%s".` ),
							menuName
						),
						{
							cause: err,
						}
					);
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
