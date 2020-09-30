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

	const [ parentMenuToMenu, setParentMenuToMenu ] = useState( {} );
	const {
		nodes: menus,
		getNode: getMenu,
		addNode: addMenu,
		removeNode: removeMenu,
	} = useNavigationTreeNodes();

	return {
		items,
		getItem,
		addItem,
		removeItem,

		menus,
		getMenu,
		addMenu: ( key, value ) => {
			setParentMenuToMenu( ( state ) => ( {
				...state,
				[ value.parentMenu ]: state[ value.parentMenu ]
					? [ ...state[ value.parentMenu ], key ]
					: [ key ],
			} ) );
			addMenu( key, value );
		},
		removeMenu,
		parentMenuToMenu,
	};
};
