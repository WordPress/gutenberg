import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockList,
	// @ts-expect-error - No type declarations available for @wordpress/block-editor
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useContext, useEffect, useMemo, useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { unlock } from '@wordpress/routes-lock-unlock';
import LeafMoreMenu from './leaf-more-menu';
import { MenuInsertedBlockContext } from './menu-inserted-block-context';

const { PrivateListView, useBlockElement } = unlock( blockEditorPrivateApis );

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

// An item added from an item's options menu opens its link popover the way
// the item settings popover opens: beside the row, top edges aligned. Same
// placement as the List View content popover, but the popover keeps its
// scroll container (`resize`): without it the link control's own top margin
// collapses out of the popover's content box. An item added from the
// appender keeps the default placement, under the row, since the appender
// spawned it.
const LINK_POPOVER_PROPS = {
	placement: 'left-start',
	offset: 35,
} as const;

function ListViewLinkUI( props: {
	insertedBlockClientId: string;
	setInsertedBlockClientId: ( clientId: string | null ) => void;
} ) {
	// Read from the global rather than imported: `@wordpress/block-library`
	// is not a script module and only loads with the lazily loaded editor
	// assets, so a static import here would compile to a read of a global
	// that does not exist yet when this bundle initializes, capturing
	// `undefined` (and crashing the screen). This component only renders once
	// `useEditorAssets` reports the assets ready, which is exactly when the
	// global is defined — do not "clean this up" into an import.
	const { NavigationLinkUI } = unlock(
		( window as any ).wp.blockLibrary.privateApis
	);
	const isMobile = useViewportMatch( 'medium', '<' );
	const { isMarked } = useContext( MenuInsertedBlockContext );
	const isFromMenu = isMarked( props.insertedBlockClientId );

	// Select the item added from the menu, so its row shows which item the
	// popover edits. Only once its block has mounted in the hidden canvas: a
	// Navigation Link that mounts already selected opens its own link popover
	// and selects its parent instead.
	const { selectBlock } = useDispatch( blockEditorStore );
	const blockElement = useBlockElement( props.insertedBlockClientId );
	useEffect( () => {
		if ( isFromMenu && blockElement ) {
			selectBlock( props.insertedBlockClientId );
		}
	}, [ isFromMenu, blockElement, props.insertedBlockClientId, selectBlock ] );

	return (
		<NavigationLinkUI
			{ ...props }
			popoverProps={
				isFromMenu && ! isMobile ? LINK_POPOVER_PROPS : undefined
			}
		/>
	);
}

export default function NavigationMenuContent( {
	rootClientId,
}: {
	rootClientId: string;
} ) {
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
	const { openListViewContentPanel } = unlock(
		useDispatch( blockEditorStore )
	);
	// A ref rather than state: it only needs reading when the popover renders,
	// and an item inserted later from the appender never matches a stale value.
	const menuInsertedBlock = useRef< string | null >( null );
	const menuInsertedBlockContext = useMemo(
		() => ( {
			mark: ( clientId: string ) => {
				menuInsertedBlock.current = clientId;
			},
			isMarked: ( clientId: string ) =>
				menuInsertedBlock.current === clientId,
		} ),
		[]
	);

	// The hidden block is needed because it makes block edit side effects trigger.
	// For example a navigation page list load its items has an effect on edit to load its items.
	return (
		<MenuInsertedBlockContext.Provider value={ menuInsertedBlockContext }>
			{ ! isLoading && (
				<PrivateListView
					rootClientId={ listViewRootClientId }
					onSelect={ openListViewContentPanel }
					blockSettingsMenu={ LeafMoreMenu }
					showAppender
					additionalBlockContent={ ListViewLinkUI }
					showContentPopover
					isExpanded
				/>
			) }
			<div className="navigation-edit-editor__hidden-blocks">
				<BlockList />
			</div>
		</MenuInsertedBlockContext.Provider>
	);
}
