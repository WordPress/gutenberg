import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockList,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';
import { unlock } from '../../lock-unlock';
import LeafMoreMenu from './leaf-more-menu';

const { PrivateListView } = unlock( blockEditorPrivateApis );
const { NavigationLinkUI } = unlock( blockLibraryPrivateApis );

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

	// The hidden block is needed because it makes block edit side effects trigger.
	// For example a navigation page list load its items has an effect on edit to load its items.
	return (
		<>
			{ ! isLoading && ! hasChildren && (
				<p className="edit-site-sidebar-navigation-screen-navigation-menus__empty-message">
					{ __( 'This Navigation Menu is empty.' ) }
				</p>
			) }
			{ ! isLoading && (
				<PrivateListView
					rootClientId={ listViewRootClientId }
					onSelect={ openListViewContentPanel }
					blockSettingsMenu={ LeafMoreMenu }
					showAppender
					additionalBlockContent={ SidebarNavigationLinkUI }
					showContentPopover
					isExpanded
				/>
			) }
			<div className="edit-site-sidebar-navigation-screen-navigation-menus__helper-block-editor">
				<BlockList />
			</div>
		</>
	);
}
