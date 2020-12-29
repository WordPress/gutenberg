/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useNavigationContext } from '../context';
import { ROOT_MENU } from '../constants';

export const useNavigationTreeMenu = ( props ) => {
	const {
		navigationTree: { addMenu, removeMenu },
	} = useNavigationContext();

	const key = props.menu || ROOT_MENU;
	useEffect( () => {
		addMenu( key, { ...props, menu: key } );

		return () => {
			removeMenu( key );
		};
	}, [] );
};
