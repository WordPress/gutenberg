/**
 * External dependencies
 */
import { useRouter, useMatches } from '@tanstack/react-router';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';
import {
	findDrilldownParent,
	findDropdownParent,
	findClosestMenuItem,
} from './path-matching';

/**
 * The `useSidebarParent` hook returns the ID of the parent menu item
 * to render in the sidebar based on the current route.
 *
 * - It finds the closest matching menu item when exact path matches fail
 * - It allows the user to navigate in the sidebar (local state) without changing the URL.
 * - If the URL changes, it will update the parent ID to ensure the correct drilldown level is displayed.
 *
 * @return The ID of the parent menu item to render in the sidebar.
 */
export function useSidebarParent() {
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
	const [ parentId, setParentId ] = useState< string | undefined >(
		findDrilldownParent( currentMenuItem?.id, menuItems )
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
		const updatedDropdownParent = findDropdownParent(
			matchedMenuItem?.id,
			menuItems
		);

		setParentId( updatedParentId );
		setParentDropdownId( updatedDropdownParent );
	}, [ currentPath, menuItems ] );

	return [
		parentId,
		setParentId,
		parentDropdownId,
		setParentDropdownId,
	] as const;
}
