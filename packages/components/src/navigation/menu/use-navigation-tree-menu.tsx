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
		// Ignore exhaustive-deps rule for now. See https://github.com/WordPress/gutenberg/pull/44090
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
};
