/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { MenuIdContext, untitledMenu } from './index';

export default function useNavigationEditorMenu() {
	const { saveMenu } = useDispatch( 'core' );
	const menuId = useContext( MenuIdContext );
	const menu = useSelect( ( select ) => select( 'core' ).getMenu( menuId ), [
		menuId,
	] );
	const menuName = menu?.name ?? untitledMenu;
	return {
		saveMenu,
		menuId,
		menu,
		menuName,
	};
}
