/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore, useEntityBlockEditor } from '@wordpress/core-data';
import { BlockEditorProvider, Inserter } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { useHistory } from '../routes';
import NavigationMenuContent from './navigation-menu-content';
import SidebarButton from '../sidebar-button';

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

	// This is copied from the edit component of the Navigation block.
	const orderedNavigationMenus = useMemo(
		() =>
			navigationMenus
				?.filter( ( menu ) => menu.status === 'publish' )
				?.sort( ( menuA, menuB ) => {
					const menuADate = new Date( menuA.date );
					const menuBDate = new Date( menuB.date );
					return menuADate.getTime() > menuBDate.getTime(); // This condition is the other way in the navigation block... hmmmm...
				} ),
		[ navigationMenus ]
	);
	const firstNavigationMenu = orderedNavigationMenus?.[ 0 ]?.id;

	const [ innerBlocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_navigation',
		{ id: firstNavigationMenu }
	);

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
				<div className="edit-site-sidebar-navigation-screen-navigation-menus__placeholder" />
				<div className="edit-site-sidebar-navigation-screen-navigation-menus__placeholder" />
				<div className="edit-site-sidebar-navigation-screen-navigation-menus__placeholder" />
			</SidebarNavigationScreenWrapper>
		);
	}

	return (
		<BlockEditorProvider
			value={ innerBlocks }
			onChange={ onChange }
			onInput={ onInput }
		>
			<SidebarNavigationScreenWrapper
				actions={
					<Inserter
						position="bottom right"
						isAppender
						selectBlockOnInsert={ false }
						shouldDirectInsert={ false }
						__experimentalIsQuick
						toggleProps={ { as: SidebarButton } }
					/>
				}
			>
				<div className="edit-site-sidebar-navigation-screen-navigation-menus__content">
					<NavigationMenuContent onSelect={ onSelect } />
				</div>
			</SidebarNavigationScreenWrapper>
		</BlockEditorProvider>
	);
}
