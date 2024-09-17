/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
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
import { useLink } from '../routes/link';
import SingleNavigationMenu from '../sidebar-navigation-screen-navigation-menu/single-navigation-menu';
import useNavigationMenuHandlers from '../sidebar-navigation-screen-navigation-menu/use-navigation-menu-handlers';
import { unlock } from '../../lock-unlock';
import { NAVIGATION_POST_TYPE } from '../../utils/constants';

// Copied from packages/block-library/src/navigation/edit/navigation-menu-selector.js.
function buildMenuLabel( title, id, status ) {
	if ( ! title ) {
		/* translators: %s is the index of the menu in the list of menus. */
		return sprintf( __( '(no title %s)' ), id );
	}

	if ( status === 'publish' ) {
		return decodeEntities( title );
	}

	return sprintf(
		// translators: %1s: title of the menu; %2s: status of the menu (draft, pending, etc.).
		__( '%1$s (%2$s)' ),
		decodeEntities( title ),
		status
	);
}

// Save a boolean to prevent us creating a fallback more than once per session.
let hasCreatedFallback = false;

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

	const firstNavigationMenu = navigationMenus?.[ 0 ];

	// Save a boolean to prevent us creating a fallback more than once per session.
	if ( firstNavigationMenu ) {
		hasCreatedFallback = true;
	}

	// If there is no navigation menu found
	// then trigger fallback algorithm to create one.
	if (
		! firstNavigationMenu &&
		! isResolvingNavigationMenus &&
		hasResolvedNavigationMenus &&
		! hasCreatedFallback
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
			<ItemGroup>
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
	const linkInfo = useLink( {
		postId,
		postType: 'wp_navigation',
	} );
	return <SidebarNavigationItem { ...linkInfo } { ...props } />;
};
