/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useEntityRecords } from '@wordpress/core-data';
import { BlockEditorProvider } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { decodeEntities } from '@wordpress/html-entities';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import SidebarNavigationItem from '../sidebar-navigation-item';
import NavigationMenuContent from './navigation-menu-content';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import {
	isPreviewingTheme,
	currentlyPreviewingTheme,
} from '../../utils/is-previewing-theme';
import { useLink } from '../routes/link';

const { useHistory } = unlock( routerPrivateApis );

const noop = () => {};
const NAVIGATION_MENUS_QUERY = {
	per_page: -1,
	status: 'publish',
	order: 'desc',
	orderby: 'date',
};

export function SidebarNavigationScreenWrapper( { children, actions } ) {
	return (
		<SidebarNavigationScreen
			title={ __( 'Navigation' ) }
			actions={ actions }
			description={ __( 'Manage your Navigation menus.' ) }
			content={ children }
		/>
	);
}

const NavMenuItem = ( { postType, postId, ...props } ) => {
	const linkInfo = useLink( {
		postType,
		postId,
	} );
	return <SidebarNavigationItem { ...linkInfo } { ...props } />;
};

const SideBarNavigationScreenNavigationMenu = ( {
	menu: firstNavigationMenu,
} ) => {
	const history = useHistory();

	const onSelect = useCallback(
		( selectedBlock ) => {
			const { attributes, name } = selectedBlock;
			if (
				attributes.kind === 'post-type' &&
				attributes.id &&
				attributes.type &&
				history
			) {
				history.push( {
					postType: attributes.type,
					postId: attributes.id,
					...( isPreviewingTheme() && {
						theme_preview: currentlyPreviewingTheme(),
					} ),
				} );
			}
			if ( name === 'core/page-list-item' && attributes.id && history ) {
				history.push( {
					postType: 'page',
					postId: attributes.id,
					...( isPreviewingTheme() && {
						theme_preview: currentlyPreviewingTheme(),
					} ),
				} );
			}
		},
		[ history ]
	);

	const { storedSettings } = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );

		return {
			storedSettings: getSettings( false ),
		};
	}, [] );

	const blocks = useMemo( () => {
		return [
			createBlock( 'core/navigation', { ref: firstNavigationMenu } ),
		];
	}, [ firstNavigationMenu ] );

	return (
		<BlockEditorProvider
			settings={ storedSettings }
			value={ blocks }
			onChange={ noop }
			onInput={ noop }
		>
			<div className="edit-site-sidebar-navigation-screen-navigation-menus__content">
				<NavigationMenuContent
					rootClientId={ blocks[ 0 ].clientId }
					onSelect={ onSelect }
				/>
			</div>
		</BlockEditorProvider>
	);
};

export default function SidebarNavigationScreenNavigationMenus() {
	const postType = 'wp_navigation';

	const { records: navigationMenus, isResolving: isLoading } =
		useEntityRecords( 'postType', `wp_navigation`, NAVIGATION_MENUS_QUERY );

	const hasNavigationMenus = !! navigationMenus?.length;
	const hasSingleNavigationMenu = navigationMenus?.length === 1;
	const firstNavigationMenu = navigationMenus?.[ 0 ]?.id;

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

	if ( hasSingleNavigationMenu ) {
		return (
			<SidebarNavigationScreenWrapper>
				<SideBarNavigationScreenNavigationMenu
					menu={ firstNavigationMenu }
				/>
			</SidebarNavigationScreenWrapper>
		);
	}

	return (
		<SidebarNavigationScreenWrapper>
			<ItemGroup>
				{ navigationMenus?.map( ( navMenu ) => (
					<NavMenuItem
						postType={ postType }
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
