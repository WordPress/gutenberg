/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockList,
	BlockTools,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { useCallback } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import LeafMoreMenu from './leaf-more-menu';

const { PrivateListView } = unlock( blockEditorPrivateApis );

// Needs to be kept in sync with the query used at packages/block-library/src/page-list/edit.js.
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
	const { listViewRootClientId, isLoading } = useSelect(
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
				// This is a small hack to wait for the navigation block
				// to actually load its inner blocks.
				isLoading:
					! areInnerBlocksControlled( rootClientId ) ||
					isLoadingPages,
			};
		},
		[ rootClientId ]
	);
	const { replaceBlock, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const offCanvasOnselect = useCallback(
		( block ) => {
			if (
				block.name === 'core/navigation-link' &&
				! block.attributes.url
			) {
				__unstableMarkNextChangeAsNotPersistent();
				replaceBlock(
					block.clientId,
					createBlock( 'core/navigation-link', block.attributes )
				);
			}
		},
		[ __unstableMarkNextChangeAsNotPersistent, replaceBlock ]
	);

	// The hidden block is needed because it makes block edit side effects trigger.
	// For example a navigation page list load its items has an effect on edit to load its items.
	return (
		<>
			{ ! isLoading && (
				<PrivateListView
					rootClientId={ listViewRootClientId }
					onSelect={ offCanvasOnselect }
					blockSettingsMenu={ LeafMoreMenu }
					showAppender={ false }
				/>
			) }
			<div className="edit-site-sidebar-navigation-screen-navigation-menus__helper-block-editor">
				<BlockTools>
					<BlockList />
				</BlockTools>
			</div>
		</>
	);
}
