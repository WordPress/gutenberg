/**
 * WordPress dependencies
 */
import { useEntityRecord } from '@wordpress/core-data';
import { __experimentalUseNavigator as useNavigator } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SidebarNavigationScreenWrapper } from '../sidebar-navigation-screen-navigation-menus';

export default function SidebarNavigationScreenNavigationMenu() {
	const postType = `wp_navigation`;
	const {
		params: { postId },
	} = useNavigator();

	const { record: navigationMenu, isResolving: isLoading } = useEntityRecord(
		'postType',
		postType,
		postId
	);

	if ( isLoading ) {
		return (
			<SidebarNavigationScreenWrapper>
				{ __( 'Loading Navigation Menu.' ) }
			</SidebarNavigationScreenWrapper>
		);
	}

	if ( ! isLoading && ! navigationMenu ) {
		return (
			<SidebarNavigationScreenWrapper>
				{ __( 'Navigation Menu Missing.' ) }
			</SidebarNavigationScreenWrapper>
		);
	}

	return (
		<SidebarNavigationScreenWrapper>
			{ navigationMenu?.title.rendered }
		</SidebarNavigationScreenWrapper>
	);
}
