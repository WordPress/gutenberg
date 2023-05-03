/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { BlockEditorProvider } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import NavigationMenuContent from './navigation-menu-content';
import { NavigationMenuLoader } from './loader';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import {
	isPreviewingTheme,
	currentlyPreviewingTheme,
} from '../../utils/is-previewing-theme';

const { useHistory } = unlock( routerPrivateApis );

const noop = () => {};
const NAVIGATION_MENUS_QUERY = {
	per_page: 1,
	status: 'publish',
	order: 'desc',
	orderby: 'date',
};

function SidebarNavigationScreenWrapper( { children, actions } ) {
	return (
		<SidebarNavigationScreen
			title={ __( 'Navigation' ) }
			actions={ actions }
			description={ __(
				'Browse your site, edit pages, and manage your primary navigation menu.'
			) }
			content={ children }
		/>
	);
}

export default function SidebarNavigationScreenNavigationMenus() {
	const history = useHistory();
	const { navigationMenus, hasResolvedNavigationMenus, storedSettings } =
		useSelect( ( select ) => {
			const { getSettings } = unlock( select( editSiteStore ) );
			const { getEntityRecords, hasFinishedResolution } =
				select( coreStore );

			const navigationMenusQuery = [
				'postType',
				'wp_navigation',
				NAVIGATION_MENUS_QUERY,
			];
			return {
				storedSettings: getSettings( false ),
				navigationMenus: getEntityRecords( ...navigationMenusQuery ),
				hasResolvedNavigationMenus: hasFinishedResolution(
					'getEntityRecords',
					navigationMenusQuery
				),
			};
		}, [] );

	const firstNavigationMenu = navigationMenus?.[ 0 ]?.id;
	const blocks = useMemo( () => {
		return [
			createBlock( 'core/navigation', { ref: firstNavigationMenu } ),
		];
	}, [ firstNavigationMenu ] );

	const isLoading = ! hasResolvedNavigationMenus;
	const hasNavigationMenus = !! navigationMenus?.length;

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

	if ( hasResolvedNavigationMenus && ! hasNavigationMenus ) {
		return (
			<SidebarNavigationScreenWrapper>
				{ __( 'There are no Navigation Menus.' ) }
			</SidebarNavigationScreenWrapper>
		);
	}

	if ( ! hasResolvedNavigationMenus || isLoading ) {
		return (
			<SidebarNavigationScreenWrapper>
				<NavigationMenuLoader />
			</SidebarNavigationScreenWrapper>
		);
	}

	return (
		<BlockEditorProvider
			settings={ storedSettings }
			value={ blocks }
			onChange={ noop }
			onInput={ noop }
		>
			<SidebarNavigationScreenWrapper>
				<div className="edit-site-sidebar-navigation-screen-navigation-menus__content">
					<NavigationMenuContent
						rootClientId={ blocks[ 0 ].clientId }
						onSelect={ onSelect }
					/>
				</div>
			</SidebarNavigationScreenWrapper>
		</BlockEditorProvider>
	);
}
