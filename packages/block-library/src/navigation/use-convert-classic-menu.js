/**
 * WordPress dependencies
 */
import { useCallback, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useNavigationEntities from './use-navigation-entities';
import menuItemsToBlocks from './menu-items-to-blocks';

export default function useConvertClassicMenu( onFinish ) {
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

	const createFromMenu = useCallback(
		( name ) => {
			const { innerBlocks: _blocks } = menuItemsToBlocks( menuItems );
			setBlocks( _blocks );
			onFinish( _blocks, name );
		},
		[ menuItems, menuItemsToBlocks, onFinish ]
	);

	useEffect( () => {
		// If the user selected a menu but we had to wait for menu items to
		// finish resolving, then create the block once resolution finishes.
		if ( isAwaitingMenuItemResolution && hasResolvedMenuItems ) {
			createFromMenu( menuName );
			setIsAwaitingMenuItemResolution( false );
		}
	}, [ isAwaitingMenuItemResolution, hasResolvedMenuItems, menuName ] );

	const dispatch = useCallback(
		( id, name ) => {
			setSelectedMenu( id );

			// If we have menu items, create the block right away.
			if ( hasResolvedMenuItems ) {
				createFromMenu( name );
				return;
			}

			// Otherwise, create the block when resolution finishes.
			setIsAwaitingMenuItemResolution( true );
			// Store the name to use later.
			setMenuName( name );
		},
		[ hasResolvedMenuItems, createFromMenu ]
	);

	return {
		dispatch,
		blocks,
		name: menuName,
		isResolving: isResolvingMenus,
		hasResolved: hasResolvedMenuItems,
	};
}
