/**
 * Internal dependencies
 */
import { useNavigationTreeNodes } from './use-navigation-tree-nodes';

export const useCreateNavigationTree = () => {
	const {
		nodes: items,
		addNode: addItem,
		removeNode: removeItem,
	} = useNavigationTreeNodes();

	const {
		nodes: menus,
		addNode: addMenu,
		removeNode: removeMenu,
	} = useNavigationTreeNodes();

	return {
		items,
		addItem,
		removeItem,

		menus,
		addMenu,
		removeMenu,
	};
};
