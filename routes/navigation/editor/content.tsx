/**
 * Adapted from packages/edit-site/src/components/sidebar-navigation-screen-navigation-menus/navigation-menu-content.js
 *
 * The block-library private APIs (LinkUI, updateAttributes, useEntityBinding,
 * NavigationLinkControls) are unlocked at render time rather than module level
 * because wp-block-library is loaded lazily via useEditorAssets() in the
 * Extensible Site Editor — it is not available when the route module first
 * evaluates.
 */

/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockList,
} from '@wordpress/block-editor';
import { Popover } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/blocks
import { createBlock } from '@wordpress/blocks';
import {
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import LeafMoreMenu from './leaf-more-menu';

type Block = {
	clientId: string;
	name: string;
	attributes: Record< string, unknown >;
};

const { PrivateListView } = unlock( blockEditorPrivateApis );

const BLOCKS_WITH_LINK_UI_SUPPORT = [
	'core/navigation-link',
	'core/navigation-submenu',
];

// block-library is loaded dynamically via useEditorAssets before this component renders.
// Access private APIs at runtime rather than via static import.
function getBlockLibraryApis() {
	const blockLibrary = (
		window as Window & {
			wp: {
				blockLibrary: { privateApis: Parameters< typeof unlock >[ 0 ] };
			};
		}
	 ).wp?.blockLibrary;
	if ( ! blockLibrary ) {
		return null;
	}
	return unlock( blockLibrary.privateApis ) as {
		NavigationLinkUI: any;
		NavigationLinkControls: any;
	};
}

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

export default function NavigationMenuContent( {
	rootClientId,
}: {
	rootClientId: string;
} ) {
	const { listViewRootClientId, isLoading, isEmpty } = useSelect(
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

			const isControlled = areInnerBlocksControlled( rootClientId );

			return {
				listViewRootClientId: pageListHasBlocks
					? blockClientIds[ 0 ]
					: rootClientId,
				// This is a small hack to wait for the navigation block
				// to actually load its inner blocks.
				isLoading: ! isControlled || isLoadingPages,
				isEmpty: isControlled && blockClientIds.length === 0,
			};
		},
		[ rootClientId ]
	);

	const {
		replaceBlock,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	const offCanvasOnselect = useCallback(
		( block: Block ) => {
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

	const [ editingBlockClientId, setEditingBlockClientId ] = useState<
		string | null
	>( null );
	const [ anchorElement, setAnchorElement ] = useState< Element | null >(
		null
	);
	const listViewRef = useRef< HTMLDivElement >( null );

	// Read block attributes fresh from the store so the popover controls
	// always reflect the latest state (e.g. after typing in the text field).
	const editingBlockAttributes = useSelect(
		( select ) => {
			if ( ! editingBlockClientId ) {
				return null;
			}
			return select( blockEditorStore ).getBlockAttributes(
				editingBlockClientId
			);
		},
		[ editingBlockClientId ]
	);

	useLayoutEffect( () => {
		if ( ! editingBlockClientId || ! listViewRef.current ) {
			setAnchorElement( null );
			return;
		}
		const element = listViewRef.current.querySelector(
			`[data-block="${ editingBlockClientId }"]`
		);
		setAnchorElement( element ?? null );
	}, [ editingBlockClientId ] );

	const handleSelect = useCallback(
		( block: Block ) => {
			if (
				BLOCKS_WITH_LINK_UI_SUPPORT.includes( block?.name ) &&
				block?.attributes?.url
			) {
				setEditingBlockClientId( block.clientId );
			} else {
				offCanvasOnselect( block );
			}
		},
		[ offCanvasOnselect ]
	);

	const blockLibraryApis = getBlockLibraryApis();
	const NavigationLinkUI = blockLibraryApis?.NavigationLinkUI ?? null;
	const NavigationLinkControls =
		blockLibraryApis?.NavigationLinkControls ?? null;

	return (
		<>
			{ ! isLoading && isEmpty && (
				<p className="navigation-edit-editor__empty">
					{ __( 'This Navigation Menu is empty.' ) }
				</p>
			) }
			{ ! isLoading && (
				<div ref={ listViewRef }>
					<PrivateListView
						rootClientId={ listViewRootClientId }
						onSelect={ handleSelect }
						blockSettingsMenu={ LeafMoreMenu }
						additionalBlockContent={ NavigationLinkUI }
						showAppender
						isExpanded
					/>
				</div>
			) }
			{ editingBlockClientId &&
				editingBlockAttributes &&
				anchorElement &&
				NavigationLinkControls && (
					<Popover
						anchor={ anchorElement }
						placement="right-start"
						onClose={ () => setEditingBlockClientId( null ) }
						className="edit-site-sidebar-navigation-screen-navigation-menus__link-editor"
					>
						<div style={ { width: '280px' } }>
							<NavigationLinkControls
								attributes={ editingBlockAttributes }
								setAttributes={ (
									newAttrs: Record< string, unknown >
								) => {
									updateBlockAttributes(
										editingBlockClientId,
										newAttrs
									);
								} }
								clientId={ editingBlockClientId }
								isContentOnly
							/>
						</div>
					</Popover>
				) }
			<div className="navigation-edit-editor__hidden-blocks">
				<BlockList />
			</div>
		</>
	);
}
