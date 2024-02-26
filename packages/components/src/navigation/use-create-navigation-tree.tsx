/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useNavigationTreeNodes } from './use-navigation-tree-nodes';

import type { NavigationContext, Item, Menu } from './types';

export const useCreateNavigationTree = () => {
	const {
		nodes: items,
		getNode: getItem,
		addNode: addItem,
		removeNode: removeItem,
	} = useNavigationTreeNodes< Item >();

	const {
		nodes: menus,
		getNode: getMenu,
		addNode: addMenu,
		removeNode: removeMenu,
	} = useNavigationTreeNodes< Menu >();

	/**
	 * Stores direct nested menus of menus
	 * This makes it easy to traverse menu tree
	 *
	 * Key is the menu prop of the menu
	 * Value is an array of menu keys
	 */
	const [ childMenu, setChildMenu ] = useState< Record< string, string[] > >(
		{}
	);
	const getChildMenu = ( menu: string ) => childMenu[ menu ] || [];

	const traverseMenu: NavigationContext[ 'navigationTree' ][ 'traverseMenu' ] =
		( startMenu, callback ) => {
			const visited: string[] = [];
			let queue = [ startMenu ];
			let current: Menu;

			while ( queue.length > 0 ) {
				// Type cast to string is safe because of the `length > 0` check above.
				current = getMenu( queue.shift() as string );

				if ( ! current || visited.includes( current.menu ) ) {
					continue;
				}

				visited.push( current.menu );
				queue = [ ...queue, ...getChildMenu( current.menu ) ];

				if ( callback( current ) === false ) {
					break;
				}
			}
		};

	const isMenuEmpty = ( menuToCheck: string ) => {
		let isEmpty = true;

		traverseMenu( menuToCheck, ( current: Menu ) => {
			if ( ! current.isEmpty ) {
				isEmpty = false;
				return false;
			}

			return undefined;
		} );

		return isEmpty;
	};

	return {
		items,
		getItem,
		addItem,
		removeItem,

		menus,
		getMenu,
		addMenu: ( key: string, value: Menu ) => {
			setChildMenu( ( state ) => {
				const newState = { ...state };

				if ( ! value.parentMenu ) {
					return newState;
				}

				if ( ! newState[ value.parentMenu ] ) {
					newState[ value.parentMenu ] = [];
				}

				newState[ value.parentMenu ].push( key );

				return newState;
			} );

			addMenu( key, value );
		},
		removeMenu,
		childMenu,
		traverseMenu,
		isMenuEmpty,
	};
};
