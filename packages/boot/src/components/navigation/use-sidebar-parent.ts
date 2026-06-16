/**
 * WordPress dependencies
 */
import { privateApis as routePrivateApis } from '@wordpress/route';
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useRouter, useMatches } = unlock( routePrivateApis );

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';
import {
	findDrilldownParent,
	findDropdownParent,
	findClosestMenuItem,
} from './path-matching';
import { ROOT_NAVIGATION_PARENT } from './use-sidebar-navigation-layout';

function resolveParentId(
	defaultParentId: string | undefined,
	customParentId: string | undefined
) {
	if ( customParentId === undefined ) {
		return defaultParentId;
	}

	if ( customParentId === ROOT_NAVIGATION_PARENT ) {
		return undefined;
	}

	return customParentId;
}

/**
 * The `useSidebarParent` hook returns the ID of the parent menu item
 * to render in the sidebar based on the current route.
 *
 * - It finds the closest matching menu item when exact path matches fail
 * - It allows the user to navigate in the sidebar (local state) without changing the URL.
 * - If the URL changes, it will update the parent ID to ensure the correct drilldown level is displayed.
 *
 * @param getNavigationParentId - Optional resolver for customized navigation sections.
 *
 * @return The ID of the parent menu item to render in the sidebar.
 */
export function useSidebarParent(
	getNavigationParentId?: ( itemId: string | undefined ) => string | undefined
) {
	const matches = useMatches();
	const router = useRouter();
	const menuItems = useSelect(
		( select ) =>
			// @ts-ignore
			select( STORE_NAME ).getMenuItems(),
		[]
	);

	const currentPath = matches[ matches.length - 1 ].pathname.slice(
		router.options.basepath?.length ?? 0
	);

	const currentMenuItem = findClosestMenuItem( currentPath, menuItems );
	const currentNavigationParentId = getNavigationParentId?.(
		currentMenuItem?.id
	);
	const [ parentId, setParentId ] = useState< string | undefined >(
		resolveParentId(
			findDrilldownParent( currentMenuItem?.id, menuItems ),
			currentNavigationParentId
		)
	);
	const [ parentDropdownId, setParentDropdownId ] = useState<
		string | undefined
	>( findDropdownParent( currentMenuItem?.id, menuItems ) );

	// Effect to update parent IDs when URL or menu items change
	useEffect( () => {
		const matchedMenuItem = findClosestMenuItem( currentPath, menuItems );
		// Find the appropriate parents for the current route
		const updatedParentId = findDrilldownParent(
			matchedMenuItem?.id,
			menuItems
		);
		const customParentId = getNavigationParentId?.( matchedMenuItem?.id );
		const updatedDropdownParent = findDropdownParent(
			matchedMenuItem?.id,
			menuItems
		);

		setParentId( resolveParentId( updatedParentId, customParentId ) );
		setParentDropdownId( updatedDropdownParent );
	}, [ currentPath, getNavigationParentId, menuItems ] );

	return [
		parentId,
		setParentId,
		parentDropdownId,
		setParentDropdownId,
	] as const;
}
