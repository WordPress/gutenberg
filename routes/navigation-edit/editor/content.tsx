/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockList,
	// @ts-expect-error - No type declarations available for @wordpress/block-editor
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/blocks
import { createBlock } from '@wordpress/blocks';
import { useState, useCallback } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
// @ts-expect-error - No type declarations available for @wordpress/block-library
import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';

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
const { LinkUI, updateAttributes, useEntityBinding } = unlock(
	blockLibraryPrivateApis
);

const BLOCKS_WITH_LINK_UI_SUPPORT = [
	'core/navigation-link',
	'core/navigation-submenu',
];

function AdditionalBlockContent( {
	block,
	insertedBlock,
	setInsertedBlock,
}: {
	block: Block;
	insertedBlock: Block | null;
	setInsertedBlock: ( block: Block | null ) => void;
} ) {
	const {
		updateBlockAttributes,
		removeBlock,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );
	const supportsLinkControls = BLOCKS_WITH_LINK_UI_SUPPORT.includes(
		insertedBlock?.name ?? ''
	);
	const blockWasJustInserted = insertedBlock?.clientId === block.clientId;
	const showLinkControls = supportsLinkControls && blockWasJustInserted;

	const { createBinding, clearBinding } = useEntityBinding( {
		clientId: insertedBlock?.clientId ?? '',
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
		( _insertedBlockClientId: string ) =>
		( _updatedAttributes: Record< string, unknown > ) => {
			if ( ! _insertedBlockClientId ) {
				return;
			}
			updateBlockAttributes( _insertedBlockClientId, _updatedAttributes );
		};

	const handleSetInsertedBlock = ( newBlock: Block | null ) => {
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
			onChange={ ( updatedValue: any ) => {
				const { isEntityLink, attributes: updatedAttributes } =
					updateAttributes(
						updatedValue,
						setInsertedBlockAttributes(
							insertedBlock?.clientId ?? ''
						),
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

export default function NavigationMenuContent( {
	rootClientId,
}: {
	rootClientId: string;
} ) {
	const [ insertedBlock, setInsertedBlock ] = useState< Block | null >(
		null
	);

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
		( block: Block ) => {
			if (
				block.name === 'core/navigation-link' &&
				! block.attributes.url
			) {
				__unstableMarkNextChangeAsNotPersistent();
				const newBlock = createBlock(
					'core/navigation-link',
					block.attributes
				);
				replaceBlock( block.clientId, newBlock );
				setInsertedBlock( newBlock );
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
					isExpanded
					additionalBlockContent={ ( block: Block ) => (
						<AdditionalBlockContent
							block={ block }
							insertedBlock={ insertedBlock }
							setInsertedBlock={ setInsertedBlock }
						/>
					) }
				/>
			) }
			<div className="navigation-edit-editor__hidden-blocks">
				<BlockList />
			</div>
		</>
	);
}
