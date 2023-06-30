/**
 * Internal dependencies
 */
import NavigationSelector from './navigation-selector';
import useNavigationMenu from './use-navigation-menu';
import useNavigationEntities from './use-navigation-entities';
import {
	DEFAULT_BLOCK,
	ALLOWED_BLOCKS,
	PRIORITIZED_INSERTER_BLOCKS,
	SELECT_NAVIGATION_MENUS_ARGS,
} from './constants';

import { lock } from './lock-unlock';

export const privateApis = {};

lock( privateApis, {
	NavigationSelector,
	useNavigationMenu,
	useNavigationEntities,
	DEFAULT_BLOCK,
	ALLOWED_BLOCKS,
	PRIORITIZED_INSERTER_BLOCKS,
	SELECT_NAVIGATION_MENUS_ARGS,
} );
