/**
 * WordPress dependencies
 */
import { useCallback, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useNavigationEntities from './use-navigation-entities';
import menuItemsToBlocks from './menu-items-to-blocks';

export default function useConvertClassicMenu() {
	const [ selectedMenu, setSelectedMenu ] = useState();
	const [
		isAwaitingMenuItemResolution,
		setIsAwaitingMenuItemResolution,
	] = useState( false );
	const [ menuName, setMenuName ] = useState( '' );
	const [ blocks, setBlocks ] = useState( [] );

	const {
		menuItems,
		hasResolvedMenuItems,
		isResolvingMenus,
	} = useNavigationEntities( selectedMenu );

	const createBlocksFromMenuItems = useCallback( () => {
		const { innerBlocks: _blocks } = menuItemsToBlocks( menuItems );
		setBlocks( _blocks );
	}, [ menuItems, menuItemsToBlocks ] );

	useEffect( () => {
		// If the user selected a menu but we had to wait for menu items to
		// finish resolving, then create the block once resolution finishes.
		if ( isAwaitingMenuItemResolution && hasResolvedMenuItems ) {
			createBlocksFromMenuItems();
			setIsAwaitingMenuItemResolution( false );
		}
	}, [ isAwaitingMenuItemResolution, hasResolvedMenuItems, menuName ] );

	const run = useCallback(
		( id, name ) => {
			setSelectedMenu( id );

			// If we have menu items, create the block right away.
			if ( hasResolvedMenuItems ) {
				createBlocksFromMenuItems();
				return;
			}

			// Otherwise, create the block when resolution finishes.
			setIsAwaitingMenuItemResolution( true );
			// Store the name to use later.
			setMenuName( name );
		},
		[ hasResolvedMenuItems, createBlocksFromMenuItems ]
	);

	return {
		run,
		blocks,
		name: menuName,
		isResolving: isResolvingMenus,
		hasResolved: hasResolvedMenuItems,
	};
}
