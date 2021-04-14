/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { MenuIdContext, untitledMenu } from './index';

export default function useSelectedMenuData() {
	const menuId = useContext( MenuIdContext );
	const menu = useSelect( ( select ) => select( 'core' ).getMenu( menuId ), [
		menuId,
	] );
	const menuName = menu?.name ?? untitledMenu;
	return {
		menuId,
		menu,
		menuName,
	};
}
