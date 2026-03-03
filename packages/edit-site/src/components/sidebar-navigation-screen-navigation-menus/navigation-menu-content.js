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
import { useState, useLayoutEffect, useRef } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import LeafMoreMenu from './leaf-more-menu';

const { PrivateListView } = unlock( blockEditorPrivateApis );
const { LinkUI, updateAttributes, useEntityBinding, NavigationLinkControls } =
	unlock( blockLibraryPrivateApis );

const BLOCKS_WITH_LINK_UI_SUPPORT = [
	'core/navigation-link',
	'core/navigation-submenu',
];

function AdditionalBlockContent( { block, insertedBlock, setInsertedBlock } ) {
	const {
		updateBlockAttributes,
		removeBlock,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );
	const supportsLinkControls = BLOCKS_WITH_LINK_UI_SUPPORT.includes(
		insertedBlock?.name
	);
	const blockWasJustInserted = insertedBlock?.clientId === block.clientId;
	const showLinkControls = supportsLinkControls && blockWasJustInserted;

	const { createBinding, clearBinding } = useEntityBinding( {
		clientId: insertedBlock?.clientId,
		attributes: insertedBlock?.attributes || {},
	} );

	if ( ! showLinkControls ) {
		return null;
	}

	const cleanupInsertedBlock = () => {
		const shouldAutoSelectBlock = false;
		if ( ! insertedBlock?.attributes?.url && insertedBlock?.clientId ) {
			__unstableMarkNextChangeAsNotPersistent();
			removeBlock( insertedBlock.clientId, shouldAutoSelectBlock );
		}
		setInsertedBlock( null );
	};

	const setInsertedBlockAttributes =
		( _insertedBlockClientId ) => ( _updatedAttributes ) => {
			if ( ! _insertedBlockClientId ) {
				return;
			}
			updateBlockAttributes( _insertedBlockClientId, _updatedAttributes );
		};

	const handleSetInsertedBlock = ( newBlock ) => {
		const shouldAutoSelectBlock = false;
		if ( insertedBlock?.clientId && newBlock ) {
			removeBlock( insertedBlock.clientId, shouldAutoSelectBlock );
		}
		setInsertedBlock( newBlock );
	};

	return (
		<LinkUI
			clientId={ insertedBlock?.clientId }
			link={ insertedBlock?.attributes }
			onBlockInsert={ handleSetInsertedBlock }
			onClose={ () => {
				cleanupInsertedBlock();
			} }
			onChange={ ( updatedValue ) => {
				const { isEntityLink, attributes: updatedAttributes } =
					updateAttributes(
						updatedValue,
						setInsertedBlockAttributes( insertedBlock?.clientId ),
						insertedBlock?.attributes
					);

				if ( isEntityLink ) {
					createBinding( updatedAttributes );
				} else {
					clearBinding();
				}

				setInsertedBlock( null );
			} }
		/>
	);
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

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Track the navigation-link block the user clicked to edit.
	const [ editingBlock, setEditingBlock ] = useState( null );
	// DOM element of the clicked list-view row, used to anchor the popover.
	const [ anchorElement, setAnchorElement ] = useState( null );
	const listViewRef = useRef();

	// Resolve the anchor DOM element whenever the editing block changes.
	useLayoutEffect( () => {
		if ( ! editingBlock?.clientId || ! listViewRef.current ) {
			setAnchorElement( null );
			return;
		}
		const element = listViewRef.current.querySelector(
			`[data-block="${ editingBlock.clientId }"]`
		);
		setAnchorElement( element ?? null );
	}, [ editingBlock?.clientId ] );

	const handleSelect = ( block ) => {
		// Only open the controls panel for blocks that have an existing URL.
		// Newly inserted empty blocks are handled by AdditionalBlockContent.
		if (
			BLOCKS_WITH_LINK_UI_SUPPORT.includes( block?.name ) &&
			block?.attributes?.url
		) {
			setEditingBlock( block );
		}
	};

	// The hidden block is needed because it makes block edit side effects trigger.
	// For example a navigation page list load its items has an effect on edit to load its items.
	return (
		<>
			{ ! isLoading && (
				<div ref={ listViewRef }>
					<PrivateListView
						rootClientId={ listViewRootClientId }
						onSelect={ handleSelect }
						blockSettingsMenu={ LeafMoreMenu }
						showAppender
						additionalBlockContent={ AdditionalBlockContent }
						isExpanded
					/>
				</div>
			) }
			{ editingBlock && anchorElement && (
				<Popover
					anchor={ anchorElement }
					placement="right-start"
					onClose={ () => setEditingBlock( null ) }
					className="edit-site-sidebar-navigation-screen-navigation-menus__link-editor"
				>
					<div style={ { width: '280px' } }>
						<NavigationLinkControls
							attributes={ editingBlock.attributes }
							setAttributes={ ( newAttrs ) => {
								updateBlockAttributes(
									editingBlock.clientId,
									newAttrs
								);
							} }
							clientId={ editingBlock.clientId }
							contentOnly
						/>
					</div>
				</Popover>
			) }
			<div className="edit-site-sidebar-navigation-screen-navigation-menus__helper-block-editor">
				<BlockList />
			</div>
		</>
	);
}
