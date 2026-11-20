import { store as blockEditorStore, BlockList } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';
import { useState } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { unlock } from '../../lock-unlock';
import AddNewPostModal from '../add-new-post';
import LeafMoreMenu from './leaf-more-menu';

const { NavigationLinkUI, NavigationMenuListView } = unlock(
	blockLibraryPrivateApis
);
const { useHistory } = unlock( routerPrivateApis );

// The sidebar's link search lists only these blocks, which work as menu items
// without editing them from the sidebar, which is not available yet. The other
// allowed blocks stay reachable from the "Add block" pane. The extensible site
// editor keeps every block on purpose. This wrapper, and the
// `allowedBlockNames` prop it sets, can go when this sidebar does.
const ALLOWED_BLOCK_NAMES = [
	'core/home-link',
	'core/search',
	'core/loginout',
	'core/site-title',
];

function SidebarNavigationLinkUI( props ) {
	return (
		<NavigationLinkUI
			{ ...props }
			allowedBlockNames={ ALLOWED_BLOCK_NAMES }
		/>
	);
}

// Needs to be kept in sync with the query used at packages/block-library/src/page-list/edit.jsx.
const MAX_PAGE_COUNT = 100;
const PAGES_QUERY = [
	'postType',
	'page',
	{
		per_page: MAX_PAGE_COUNT,
		_fields: [ 'id', 'link', 'menu_order', 'parent', 'title', 'type' ],
		// TODO: When https://core.trac.wordpress.org/ticket/39037 REST API support for multiple orderby
		// values is resolved, update 'orderby' to [ 'menu_order', 'post_title' ] to provide a consistent
		// sort.
		orderby: 'menu_order',
		order: 'asc',
	},
];

export default function NavigationMenuContent( { rootClientId } ) {
	const { listViewRootClientId, isLoading, hasChildren } = useSelect(
		( select ) => {
			const {
				areInnerBlocksControlled,
				getBlockName,
				getBlockCount,
				getBlockOrder,
			} = select( blockEditorStore );
			const { isResolving } = select( coreStore );

			const blockClientIds = getBlockOrder( rootClientId );

			const hasOnlyPageListBlock =
				blockClientIds.length === 1 &&
				getBlockName( blockClientIds[ 0 ] ) === 'core/page-list';
			const pageListHasBlocks =
				hasOnlyPageListBlock &&
				getBlockCount( blockClientIds[ 0 ] ) > 0;

			const isLoadingPages = isResolving(
				'getEntityRecords',
				PAGES_QUERY
			);

			return {
				listViewRootClientId: pageListHasBlocks
					? blockClientIds[ 0 ]
					: rootClientId,
				hasChildren: blockClientIds.length > 0,
				// This is a small hack to wait for the navigation block
				// to actually load its inner blocks.
				isLoading:
					! areInnerBlocksControlled( rootClientId ) ||
					isLoadingPages,
			};
		},
		[ rootClientId ]
	);
	const { openListViewContentPanel } = unlock(
		useDispatch( blockEditorStore )
	);
	const history = useHistory();
	// An Auto menu's "Add a page" opens the same dialog as the Pages screen,
	// and then the new page, as the Pages screen does.
	const [ isAddingPage, setIsAddingPage ] = useState( false );

	// The hidden block is needed because it makes block edit side effects trigger.
	// For example a navigation page list load its items has an effect on edit to load its items.
	return (
		<>
			{ ! isLoading && ! hasChildren && (
				<p className="edit-site-sidebar-navigation-screen-navigation-menus__empty-message">
					{ globalThis.__experimentalNavigationMenuEditing
						? __( 'This menu is empty.' )
						: __( 'This Navigation Menu is empty.' ) }
				</p>
			) }
			{ ! isLoading && (
				<NavigationMenuListView
					rootClientId={ listViewRootClientId }
					navigationClientId={ rootClientId }
					// The screen's description says it's an Auto menu.
					onSelect={ openListViewContentPanel }
					blockSettingsMenu={ LeafMoreMenu }
					showAppender
					additionalBlockContent={ SidebarNavigationLinkUI }
					showContentPopover
					isExpanded
					onAddPage={ () => setIsAddingPage( true ) }
				/>
			) }
			{ isAddingPage && (
				<AddNewPostModal
					postType="page"
					onSave={ ( { type, id } ) => {
						setIsAddingPage( false );
						history.navigate( `/${ type }/${ id }?canvas=edit` );
					} }
					onClose={ () => setIsAddingPage( false ) }
				/>
			) }
			<div className="edit-site-sidebar-navigation-screen-navigation-menus__helper-block-editor">
				<BlockList />
			</div>
		</>
	);
}
