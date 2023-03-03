/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { BlockEditorProvider, Inserter } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useHistory } from '../routes';
import NavigationMenuContent from './navigation-menu-content';
import SidebarButton from '../sidebar-button';
import { NavigationMenuLoader } from './loader';

const noop = () => {};
const NAVIGATION_MENUS_QUERY = { per_page: -1, status: 'publish' };

function SidebarNavigationScreenWrapper( { children, actions } ) {
	return (
		<SidebarNavigationScreen
			title={ __( 'Navigation' ) }
			actions={ actions }
			content={
				<>
					<p className="edit-site-sidebar-navigation-screen-navigation-menus__description">
						{ __(
							'Browse your site, edit pages, and manage your primary navigation menu.'
						) }
					</p>
					{ children }
				</>
			}
		/>
	);
}

export default function SidebarNavigationScreenNavigationMenus() {
	const history = useHistory();
	const { navigationMenus, hasResolvedNavigationMenus } = useSelect(
		( select ) => {
			const { getEntityRecords, hasFinishedResolution } =
				select( coreStore );

			const navigationMenusQuery = [
				'postType',
				'wp_navigation',
				NAVIGATION_MENUS_QUERY,
			];
			return {
				navigationMenus: getEntityRecords( ...navigationMenusQuery ),
				hasResolvedNavigationMenus: hasFinishedResolution(
					'getEntityRecords',
					navigationMenusQuery
				),
			};
		},
		[]
	);

	// Sort navigation menus by date.
	const orderedNavigationMenus = useMemo(
		() =>
			navigationMenus?.sort( ( menuA, menuB ) => {
				const menuADate = new Date( menuA.date );
				const menuBDate = new Date( menuB.date );
				return menuADate.getTime() > menuBDate.getTime();
			} ),
		[ navigationMenus ]
	);
	const firstNavigationMenu = orderedNavigationMenus?.[ 0 ]?.id;
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
				} );
			}
			if ( name === 'core/page-list-item' && attributes.id && history ) {
				history.push( {
					postType: 'page',
					postId: attributes.id,
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
			value={ blocks }
			onChange={ noop }
			onInput={ noop }
		>
			<SidebarNavigationScreenWrapper
				actions={
					<Inserter
						rootClientId={ blocks[ 0 ].clientId }
						position="bottom right"
						isAppender
						selectBlockOnInsert={ false }
						shouldDirectInsert={ false }
						__experimentalIsQuick
						toggleProps={ {
							as: SidebarButton,
							label: __( 'Add menu item' ),
						} }
					/>
				}
			>
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
