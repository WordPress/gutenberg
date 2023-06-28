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
import { useEffect } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';
import { PRELOADED_NAVIGATION_MENUS_QUERY } from './constants';
import { useLink } from '../routes/link';
import { unlock } from '../../lock-unlock';
const { useHistory } = unlock( routerPrivateApis );

// Copied from packages/block-library/src/navigation/edit/navigation-menu-selector.js.
function buildMenuLabel( title, id, status ) {
	if ( ! title?.rendered ) {
		/* translators: %s is the index of the menu in the list of menus. */
		return sprintf( __( '(no title %s)' ), id );
	}

	if ( status === 'publish' ) {
		return decodeEntities( title?.rendered );
	}

	return sprintf(
		// translators: %1s: title of the menu; %2s: status of the menu (draft, pending, etc.).
		__( '%1$s (%2$s)' ),
		decodeEntities( title?.rendered ),
		status
	);
}

export default function SidebarNavigationScreenNavigationMenus() {
	const {
		records: navigationMenus,
		isResolving: isResolvingNavigationMenus,
		hasResolved: hasResolvedNavigationMenus,
	} = useEntityRecords(
		'postType',
		`wp_navigation`,
		PRELOADED_NAVIGATION_MENUS_QUERY
	);

	const isLoading =
		isResolvingNavigationMenus && ! hasResolvedNavigationMenus;

	const getNavigationFallbackId = useSelect(
		( select ) => select( coreStore ).getNavigationFallbackId
	);

	const firstNavigationMenu = navigationMenus?.[ 0 ];

	// If there is no navigation menu found
	// then trigger fallback algorithm to create one.
	if (
		! firstNavigationMenu &&
		! isResolvingNavigationMenus &&
		hasResolvedNavigationMenus
	) {
		getNavigationFallbackId();
	}

	const history = useHistory();

	const hasNavigationMenus = !! navigationMenus?.length;

	// If there is a **single** menu, then immediately
	// redirect to the route for that menu. There are no
	// dependencies for this effect because we always
	// want it to run and it does no work if there is
	// more than one menu.
	useEffect( () => {
		if ( navigationMenus?.length === 1 ) {
			history.replace( {
				postId: navigationMenus[ 0 ].id,
				postType: 'wp_navigation',
			} );
		}
	} );

	if ( isLoading || navigationMenus?.length === 1 ) {
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

	return (
		<SidebarNavigationScreenWrapper>
			<ItemGroup>
				{ navigationMenus?.map( ( { id, title, status }, index ) => (
					<NavMenuItem
						postId={ id }
						key={ id }
						withChevron
						icon={ navigation }
					>
						{ buildMenuLabel( title, index + 1, status ) }
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
			description={ description || __( 'Manage your Navigation menus.' ) }
			content={ children }
			backPath={ backPath }
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
