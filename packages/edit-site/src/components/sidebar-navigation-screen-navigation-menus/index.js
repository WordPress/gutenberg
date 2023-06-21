/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';

import { decodeEntities } from '@wordpress/html-entities';
import {
	__experimentalItemGroup as ItemGroup,
	Spinner,
} from '@wordpress/components';
import { navigation } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { PRELOADED_NAVIGATION_MENUS_QUERY } from './constants';
import { useLink } from '../routes/link';
import SingleNavigationMenu from '../sidebar-navigation-screen-navigation-menu/single-navigation-menu';
import useNavigationMenuHandlers from '../sidebar-navigation-screen-navigation-menu/use-navigation-menu-handlers';

export default function SidebarNavigationScreenNavigationMenus() {
	const { records: navigationMenus, isResolving: isLoading } =
		useEntityRecords(
			'postType',
			`wp_navigation`,
			PRELOADED_NAVIGATION_MENUS_QUERY
		);

	const firstNavigationMenu = navigationMenus?.[ 0 ];

	const { handleSave, handleDelete, handleDuplicate } =
		useNavigationMenuHandlers();

	const hasNavigationMenus = !! navigationMenus?.length;

	if ( isLoading ) {
		return (
			<SidebarNavigationScreenWrapper>
				<Spinner className="edit-site-sidebar-navigation-screen-navigation-menus__loading" />
			</SidebarNavigationScreenWrapper>
		);
	}

	if ( ! isLoading && ! hasNavigationMenus ) {
		return (
			<SidebarNavigationScreenWrapper
				description={ __( 'No Navigation Menus found.' ) }
			/>
		);
	}

	// if single menu then render it
	if ( navigationMenus?.length === 1 ) {
		return (
			<SingleNavigationMenu
				navigationMenu={ firstNavigationMenu }
				handleDelete={ () => handleDelete( firstNavigationMenu ) }
				handleDuplicate={ () => handleDuplicate( firstNavigationMenu ) }
				handleSave={ () => handleSave( firstNavigationMenu ) }
			/>
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
						icon={ navigation }
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
