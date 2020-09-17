/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useNavigationContext } from '../context';
import { useNavigationMenuContext } from '../menu/context';
import { normalizedSearch } from '../utils';

export const useNavigationTreeItem = ( props ) => {
	const {
		activeMenu,
		navigationTree: { addItem, removeItem },
	} = useNavigationContext();
	const { menu, search } = useNavigationMenuContext();

	const key = props.item;
	useEffect( () => {
		const isMenuActive = activeMenu === menu;
		const isItemVisible =
			! search || normalizedSearch( props.title, search );

		addItem( key, {
			...props,
			menu,
			_isVisible: isMenuActive && isItemVisible,
		} );

		return () => {
			removeItem( key );
		};
	}, [ activeMenu, search ] );
};
