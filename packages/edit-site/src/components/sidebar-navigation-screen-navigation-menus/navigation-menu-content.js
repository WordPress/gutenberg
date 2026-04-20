/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockList,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import {
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import LeafMoreMenu from './leaf-more-menu';

const { PrivateListView } = unlock( blockEditorPrivateApis );
const { NavigationLinkUI } = unlock( blockLibraryPrivateApis );

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
	const [ editingBlock, setEditingBlock ] = useState( null );
	const [ editingPopoverAnchor, setEditingPopoverAnchor ] = useState( null );
	const listViewRef = useRef( null );
	const isMobile = useViewportMatch( 'medium', '<' );

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

	useLayoutEffect( () => {
		if ( ! editingBlock?.clientId || ! listViewRef.current ) {
			setEditingPopoverAnchor( null );
			return;
		}

		setEditingPopoverAnchor(
			listViewRef.current.querySelector(
				`[data-block="${ editingBlock.clientId }"]`
			)
		);
	}, [ editingBlock ] );

	const editingPopoverProps = useMemo(
		() =>
			isMobile
				? undefined
				: {
						placement: 'right-start',
						offset: 16,
				  },
		[ isMobile ]
	);

	const LeafMoreMenuWithEditingBlock = useCallback(
		( props ) => {
			return (
				<LeafMoreMenu
					{ ...props }
					setEditingBlock={ setEditingBlock }
				/>
			);
		},
		[ setEditingBlock ]
	);

	const NavigationLinkUIWithEditingBlock = useCallback(
		( props ) => {
			return (
				<NavigationLinkUI
					{ ...props }
					editingBlock={ editingBlock }
					editingPopoverAnchor={ editingPopoverAnchor }
					editingPopoverProps={ editingPopoverProps }
					setEditingBlock={ setEditingBlock }
				/>
			);
		},
		[
			editingBlock,
			editingPopoverAnchor,
			editingPopoverProps,
			setEditingBlock,
		]
	);

	// The hidden block is needed because it makes block edit side effects trigger.
	// For example a navigation page list load its items has an effect on edit to load its items.
	return (
		<>
			{ ! isLoading && (
				<PrivateListView
					ref={ listViewRef }
					rootClientId={ listViewRootClientId }
					onSelect={ offCanvasOnselect }
					blockSettingsMenu={ LeafMoreMenuWithEditingBlock }
					showAppender
					additionalBlockContent={ NavigationLinkUIWithEditingBlock }
					isExpanded
				/>
			) }
			<div className="edit-site-sidebar-navigation-screen-navigation-menus__helper-block-editor">
				<BlockList />
			</div>
		</>
	);
}
