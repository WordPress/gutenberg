/**
 * WordPress dependencies
 */
import { useEntityRecord } from '@wordpress/core-data';

export default function useNavigationMenu( ref ) {
	const navigationMenu = useEntityRecord( 'postType', 'wp_navigation', ref );

	return {
		isNavigationMenuMissing: navigationMenu.isMissing,
		navigationMenu:
			navigationMenu.record?.status !== 'publish'
				? null
				: navigationMenu.record,
	};
}
