import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockList,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { unlock } from '../../../lock-unlock';
import LeafMoreMenu from './leaf-more-menu';

const { PrivateListView } = unlock( blockEditorPrivateApis );

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

export default function NavigationMenuContent( {
	rootClientId,
}: {
	rootClientId: string;
} ) {
	// Read from the global rather than imported: `@wordpress/editor` does not
	// depend on `@wordpress/block-library`, which the extensible site editor
	// also loads lazily with the editor assets. Callers render this only once
	// those assets are ready, which is when the global is defined.
	const { NavigationLinkUI } = unlock(
		( window as any ).wp.blockLibrary.privateApis
	);

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
				<p className="editor-site-part-menu-editor__empty-message">
					{ __( 'This Navigation Menu is empty.' ) }
				</p>
			) }
			{ ! isLoading && (
				<PrivateListView
					rootClientId={ listViewRootClientId }
					onSelect={ openListViewContentPanel }
					blockSettingsMenu={ LeafMoreMenu }
					showAppender
					additionalBlockContent={ NavigationLinkUI }
					showContentPopover
					isExpanded
				/>
			) }
			<div className="editor-site-part-menu-editor__hidden-blocks">
				<BlockList />
			</div>
		</>
	);
}
