/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useNavigationContext } from '../context';
import { useNavigationGroupContext } from '../group/context';
import { useNavigationMenuContext } from '../menu/context';
import { normalizedSearch } from '../utils';

export const useNavigationTreeItem = ( itemId, props ) => {
	const {
		activeMenu,
		navigationTree: { addItem, removeItem },
	} = useNavigationContext();
	const { group } = useNavigationGroupContext();
	const { menu, search } = useNavigationMenuContext();

	useEffect( () => {
		const isMenuActive = activeMenu === menu;
		const isItemVisible =
			! search || normalizedSearch( props.title, search );

		addItem( itemId, {
			...props,
			group,
			menu,
			_isVisible: isMenuActive && isItemVisible,
		} );

		return () => {
			removeItem( itemId );
		};
	}, [ activeMenu, search ] );
};
