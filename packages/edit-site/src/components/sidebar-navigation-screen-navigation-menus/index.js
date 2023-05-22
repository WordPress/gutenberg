/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';

import { decodeEntities } from '@wordpress/html-entities';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';

import { useLink } from '../routes/link';

const NAVIGATION_MENUS_QUERY = {
	per_page: -1,
	status: 'publish',
	order: 'desc',
	orderby: 'date',
};

export default function SidebarNavigationScreenNavigationMenus() {
	const { records: navigationMenus, isResolving: isLoading } =
		useEntityRecords( 'postType', `wp_navigation`, NAVIGATION_MENUS_QUERY );

	const hasNavigationMenus = !! navigationMenus?.length;

	if ( isLoading ) {
		return (
			<SidebarNavigationScreenWrapper>
				{ __( 'Loading Navigation Menus.' ) }
			</SidebarNavigationScreenWrapper>
		);
	}

	if ( ! isLoading && ! hasNavigationMenus ) {
		return (
			<SidebarNavigationScreenWrapper>
				{ __( 'There are no Navigation Menus.' ) }
			</SidebarNavigationScreenWrapper>
		);
	}

	return (
		<SidebarNavigationScreenWrapper>
			<ItemGroup>
				{ navigationMenus?.map( ( navMenu ) => (
					<NavMenuItem
						postId={ navMenu.id }
						key={ navMenu.id }
						withChevron
					>
						{ decodeEntities(
							navMenu.title?.rendered || navMenu.slug
						) }
					</NavMenuItem>
				) ) }
			</ItemGroup>
		</SidebarNavigationScreenWrapper>
	);
}

export function SidebarNavigationScreenWrapper( {
	children,
	actions,
	title,
	description,
} ) {
	return (
		<SidebarNavigationScreen
			title={ title || __( 'Navigation' ) }
			actions={ actions }
			description={ description || __( 'Manage your Navigation menus.' ) }
			content={ children }
		/>
	);
}

const NavMenuItem = ( { postId, ...props } ) => {
	const linkInfo = useLink( {
		postId,
		postType: 'wp_navigation',
	} );
	return <SidebarNavigationItem { ...linkInfo } { ...props } />;
};
