/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useNavigationTreeNodes } from './use-navigation-tree-nodes';

export const useCreateNavigationTree = () => {
	const {
		nodes: items,
		getNode: getItem,
		addNode: addItem,
		removeNode: removeItem,
	} = useNavigationTreeNodes();

	const {
		nodes: menus,
		getNode: getMenu,
		addNode: addMenu,
		removeNode: removeMenu,
	} = useNavigationTreeNodes();

	const [ directSubMenus, setDirectSubMenus ] = useState( {} );
	const getDirectSubMenus = ( menu ) => directSubMenus[ menu ] || [];

	const traverseMenu = ( startMenu, callback ) => {
		const visited = [];
		let queue = [ startMenu ];
		let current;

		while ( queue.length > 0 ) {
			current = getMenu( queue.shift() );

			if ( ! current || visited.includes( current.menu ) ) {
				continue;
			}

			visited.push( current.menu );
			queue = [ ...queue, ...getDirectSubMenus( current.menu ) ];

			callback( current );
		}
	};

	const isMenuEmpty = ( menuToCheck ) => {
		let count = 0;

		traverseMenu( menuToCheck, ( current ) => {
			if ( ! current.isEmpty ) {
				count++;
			}
		} );

		return count === 0;
	};

	return {
		items,
		getItem,
		addItem,
		removeItem,

		menus,
		getMenu,
		addMenu: ( key, value ) => {
			setDirectSubMenus( ( state ) => {
				const newState = { ...state };

				if ( ! newState[ value.parentMenu ] ) {
					newState[ value.parentMenu ] = [];
				}

				newState[ value.parentMenu ].push( key );

				return newState;
			} );

			addMenu( key, value );
		},
		removeMenu,
		directSubMenus,
		traverseMenu,
		isMenuEmpty,
	};
};
