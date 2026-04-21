/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useNavigationContext } from '../context';
import { ROOT_MENU } from '../constants';

import type { NavigationMenuProps } from '../types';

export const useNavigationTreeMenu = ( props: NavigationMenuProps ) => {
	const {
		navigationTree: { addMenu, removeMenu },
	} = useNavigationContext();

	const key = props.menu || ROOT_MENU;
	useEffect( () => {
		addMenu( key, { ...props, menu: key } );

		return () => {
			removeMenu( key );
		};
		// Not adding deps for now, as it would require either a larger refactor
		// See https://github.com/WordPress/gutenberg/pull/44090
	}, [] );
};
