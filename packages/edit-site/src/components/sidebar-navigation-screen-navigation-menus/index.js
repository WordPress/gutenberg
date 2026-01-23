/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

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
import SingleNavigationMenu from '../sidebar-navigation-screen-navigation-menu/single-navigation-menu';
import useNavigationMenuHandlers from '../sidebar-navigation-screen-navigation-menu/use-navigation-menu-handlers';
import { unlock } from '../../lock-unlock';
import { NAVIGATION_POST_TYPE } from '../../utils/constants';

// Copied from packages/block-library/src/navigation/edit/navigation-menu-selector.js.
function buildMenuLabel( title, id, status ) {
	if ( ! title ) {
		/* translators: %s: the index of the menu in the list of menus. */
		return sprintf( __( '(no title %s)' ), id );
	}

	if ( status === 'publish' ) {
		return decodeEntities( title );
	}

	return sprintf(
		// translators: 1: title of the menu. 2: status of the menu (draft, pending, etc.).
		_x( '%1$s (%2$s)', 'menu label' ),
		decodeEntities( title ),
		status
	);
}

export default function SidebarNavigationScreenNavigationMenus( { backPath } ) {
	const {
		records: navigationMenus,
		isResolving: isResolvingNavigationMenus,
		hasResolved: hasResolvedNavigationMenus,
	} = useEntityRecords(
		'postType',
		NAVIGATION_POST_TYPE,
		PRELOADED_NAVIGATION_MENUS_QUERY
	);

	const isLoading =
		isResolvingNavigationMenus && ! hasResolvedNavigationMenus;

	const { getNavigationFallbackId } = unlock( useSelect( coreStore ) );
	const isCreatingNavigationFallback = useSelect(
		( select ) =>
			select( coreStore ).isResolving( 'getNavigationFallbackId' ),
		[]
	);

	const firstNavigationMenu = navigationMenus?.[ 0 ];

	// If there is no navigation menu found
	// then trigger fallback algorithm to create one.
	if (
		! firstNavigationMenu &&
		! isResolvingNavigationMenus &&
		hasResolvedNavigationMenus &&
		// Ensure a fallback navigation is created only once
		! isCreatingNavigationFallback
	) {
		getNavigationFallbackId();
	}

	const { handleSave, handleDelete, handleDuplicate } =
		useNavigationMenuHandlers();

	const hasNavigationMenus = !! navigationMenus?.length;

	if ( isLoading ) {
		return (
			<SidebarNavigationScreenWrapper backPath={ backPath }>
				<Spinner className="edit-site-sidebar-navigation-screen-navigation-menus__loading" />
			</SidebarNavigationScreenWrapper>
		);
	}

	if ( ! isLoading && ! hasNavigationMenus ) {
		return (
			<SidebarNavigationScreenWrapper
				description={ __( 'No Navigation Menus found.' ) }
				backPath={ backPath }
			/>
		);
	}

	// if single menu then render it
	if ( navigationMenus?.length === 1 ) {
		return (
			<SingleNavigationMenu
				navigationMenu={ firstNavigationMenu }
				backPath={ backPath }
				handleDelete={ () => handleDelete( firstNavigationMenu ) }
				handleDuplicate={ () => handleDuplicate( firstNavigationMenu ) }
				handleSave={ ( edits ) =>
					handleSave( firstNavigationMenu, edits )
				}
			/>
		);
	}

	return (
		<SidebarNavigationScreenWrapper backPath={ backPath }>
			<ItemGroup className="edit-site-sidebar-navigation-screen-navigation-menus">
				{ navigationMenus?.map( ( { id, title, status }, index ) => (
					<NavMenuItem
						postId={ id }
						key={ id }
						withChevron
						icon={ navigation }
					>
						{ buildMenuLabel( title?.rendered, index + 1, status ) }
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
	backPath,
} ) {
	return (
		<SidebarNavigationScreen
			title={ title || __( 'Navigation' ) }
			actions={ actions }
			description={ description || __( 'Manage your Navigation Menus.' ) }
			backPath={ backPath }
			content={ children }
		/>
	);
}

const NavMenuItem = ( { postId, ...props } ) => {
	return (
		<SidebarNavigationItem
			to={ `/wp_navigation/${ postId }` }
			{ ...props }
		/>
	);
};
