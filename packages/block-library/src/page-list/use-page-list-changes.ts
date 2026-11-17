import { useRegistry } from '@wordpress/data';
import type { createRegistry } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import {
	PAGE_LIST_ITEM,
	getHiddenPageIds,
	getMissingPageIds,
	getPageIds,
	getNonPageBlocks,
	getPageTitle,
	getPageTreeEdits,
} from './utils';
import type { PageListPage, PageListTreeBlock } from './utils';

type Registry = ReturnType< typeof createRegistry >;

interface BlockEditorSelectors {
	getBlocksByName: ( name: string ) => string[];
	getBlockAttributes: ( clientId: string ) => Record< string, any > | null;
	getBlockParents: ( clientId: string ) => string[];
	getBlockRootClientId: ( clientId: string ) => string | null;
	getBlockIndex: ( clientId: string ) => number;
	getBlockOrder: ( rootClientId?: string | null ) => string[];
}

interface BlockEditorActions {
	moveBlocksToPosition: (
		clientIds: string[],
		fromRootClientId: string | null,
		toRootClientId: string | null,
		index: number
	) => void;
	removeBlocks: ( clientIds: string[], selectPrevious?: boolean ) => void;
	__unstableMarkNextChangeAsNotPersistent: () => void;
}

export interface PendingDetach {
	/** What will happen, for the dialog. */
	message: string;
	/** Client IDs of pages moved out of the Page List, to turn into links. */
	movedOutClientIds: string[];
	/** Called once the Page List is detached. */
	confirm: () => void;
	/** Puts things back as they were. */
	cancel: () => void;
}

/**
 * Returns what of a Page List's inner blocks shows in the editor, to compare
 * the blocks someone changed with the blocks made from the pages.
 *
 * @param blocks Inner blocks.
 *
 * @return A key that changes when what's shown changes.
 */
export function getPageListBlocksKey( blocks: PageListTreeBlock[] ): string {
	return JSON.stringify(
		blocks.map( ( { name, clientId, attributes, innerBlocks } ) =>
			name === PAGE_LIST_ITEM
				? [
						attributes.id,
						attributes.title,
						attributes.link,
						attributes.metadata?.blockVisibility === false,
						getPageListBlocksKey( innerBlocks ),
					]
				: clientId
		)
	);
}

/**
 * Runs a block editor change after the change being handled, so that it
 * isn't made from inside the block editor store's subscription, and doesn't
 * get an undo level of its own.
 *
 * @param registry Data registry.
 * @param change   Makes the change.
 */
function runAfterChange( registry: Registry, change: () => void ) {
	Promise.resolve().then( () => {
		(
			registry.dispatch( blockEditorStore ) as BlockEditorActions
		 ).__unstableMarkNextChangeAsNotPersistent();
		change();
	} );
}

/**
 * Turns changes to a Page List's inner blocks, made the way items of a
 * Navigation block are changed, into changes to the pages:
 *
 * - Moving a page, to another position or level, edits the `menu_order` and
 *   `parent` of the pages at the levels it changes.
 * - Hiding a page, with the standard Hide, adds it to `excludedPageIDs`.
 *   Removing one hides it, as a Page List lists every page.
 * - Putting another item between pages, or moving a page among the other
 *   items, can't be done to a Page List, so it asks to detach the Page List
 *   first. An item put before or after all the pages is moved out of the Page
 *   List, and a page moved next to the Page List back into it, instead.
 *
 * @param options                 Options.
 * @param options.clientId        Client ID of the Page List block.
 * @param options.parentPageID    ID of the page it starts from.
 * @param options.excludedPageIDs IDs of its hidden pages.
 * @param options.pagesByParentId Pages keyed by parent page ID.
 * @param options.setAttributes   Sets the Page List's attributes.
 * @param options.menuClientIds   Client IDs of the blocks in the menu around
 *                                the Page List, as they were before the change.
 *
 * @return `onChange` for the inner blocks; `changedBlocks`, the last blocks
 * it was given, with `isHeld` when they must stay as they are while a change
 * is pending; and `pendingDetach`, with the dialog's `message`, the client
 * IDs of pages moved out of the Page List, and `confirm` and `cancel`.
 */
export function usePageListChanges( {
	clientId,
	parentPageID,
	excludedPageIDs,
	pagesByParentId,
	setAttributes,
	menuClientIds,
}: {
	clientId: string;
	parentPageID: number;
	excludedPageIDs: number[];
	pagesByParentId: Map< number, PageListPage[] >;
	setAttributes: ( attributes: { excludedPageIDs: number[] } ) => void;
	menuClientIds: string[];
} ) {
	const registry = useRegistry();
	const [ changedBlocks, setChangedBlocks ] = useState< {
		blocks: PageListTreeBlock[];
		isHeld: boolean;
	} | null >( null );
	const [ pendingDetach, setPendingDetach ] =
		useState< PendingDetach | null >( null );
	const select = () =>
		registry.select( blockEditorStore ) as unknown as BlockEditorSelectors;
	const dispatch = () =>
		registry.dispatch( blockEditorStore ) as unknown as BlockEditorActions;

	const pagesById = new Map< number, PageListPage >();
	for ( const siblings of pagesByParentId.values() ) {
		for ( const page of siblings ) {
			pagesById.set( page.id, page );
		}
	}

	// A page block outside this Page List, after a page was moved out of it.
	const findMovedOutPage = ( pageId: number ) => {
		const { getBlocksByName, getBlockAttributes, getBlockParents } =
			select();
		return getBlocksByName( PAGE_LIST_ITEM ).find(
			( pageClientId ) =>
				getBlockAttributes( pageClientId )?.id === pageId &&
				! getBlockParents( pageClientId ).includes( clientId )
		);
	};

	const askToDetach = (
		blocks: PageListTreeBlock[],
		{
			message,
			movedOutClientIds = [],
			cancel,
		}: {
			message: string;
			movedOutClientIds?: string[];
			cancel: () => void;
		}
	) => {
		setChangedBlocks( { blocks, isHeld: true } );
		setPendingDetach( {
			message,
			movedOutClientIds,
			cancel: () => {
				setPendingDetach( null );
				setChangedBlocks( null );
				cancel();
			},
			confirm: () => {
				setPendingDetach( null );
				setChangedBlocks( null );
			},
		} );
	};

	const undo = () => {
		( registry.dispatch( coreStore ) as { undo: () => void } ).undo();
	};

	const onChange = ( blocks: PageListTreeBlock[] ) => {
		if ( pendingDetach ) {
			setChangedBlocks( { blocks, isHeld: true } );
			return;
		}

		const { getBlockRootClientId, getBlockIndex, getBlockOrder } = select();
		const { moveBlocksToPosition, removeBlocks } = dispatch();
		const rootClientId = getBlockRootClientId( clientId );

		// Items put among the pages.
		const nonPageBlocks = getNonPageBlocks( blocks );
		if ( nonPageBlocks.length ) {
			const pageIndexes = blocks
				.map( ( block, index ) =>
					block.name === PAGE_LIST_ITEM ? index : -1
				)
				.filter( ( index ) => index !== -1 );
			const before = pageIndexes.length
				? blocks.slice( 0, pageIndexes[ 0 ] )
				: blocks;
			const after = pageIndexes.length
				? blocks.slice( pageIndexes[ pageIndexes.length - 1 ] + 1 )
				: [];

			// Before or after every page: put them next to the Page List.
			if ( before.length + after.length === nonPageBlocks.length ) {
				setChangedBlocks( { blocks, isHeld: true } );
				runAfterChange( registry, () => {
					if ( after.length ) {
						moveBlocksToPosition(
							after.map( ( block ) => block.clientId ),
							clientId,
							rootClientId,
							getBlockIndex( clientId ) + 1
						);
					}
					if ( before.length ) {
						moveBlocksToPosition(
							before.map( ( block ) => block.clientId ),
							clientId,
							rootClientId,
							getBlockIndex( clientId )
						);
					}
				} );
				return;
			}

			const nonPageClientIds = nonPageBlocks.map(
				( block ) => block.clientId
			);
			// Items that weren't in the menu before were just added.
			const wasInserted = nonPageClientIds.every(
				( id ) => ! menuClientIds.includes( id )
			);
			askToDetach( blocks, {
				message: __(
					'Only pages can go between the pages of a Page List. To put this item there, the Page List will be detached: its pages will become links that you can edit like any other link. New pages will still be added automatically.'
				),
				// A new item is removed again, and a moved one moved back.
				cancel: wasInserted
					? () =>
							runAfterChange( registry, () =>
								removeBlocks( nonPageClientIds, false )
							)
					: undo,
			} );
			return;
		}

		// Pages moved out of the Page List, or removed.
		const missingPageIds = getMissingPageIds(
			pagesByParentId,
			parentPageID,
			blocks
		);
		const movedOutClientIds = missingPageIds
			.map( findMovedOutPage )
			.filter( ( id ): id is string => !! id );
		if ( movedOutClientIds.length ) {
			const [ pageClientId ] = movedOutClientIds;
			const index = getBlockIndex( clientId );
			const pageIndex = getBlockIndex( pageClientId );
			const isNextToPageList =
				movedOutClientIds.length === 1 &&
				getBlockRootClientId( pageClientId ) === rootClientId &&
				( pageIndex === index - 1 || pageIndex === index + 1 );

			// Next to the Page List: put it back, as its first or last page.
			if ( isNextToPageList ) {
				setChangedBlocks( { blocks, isHeld: true } );
				runAfterChange( registry, () =>
					moveBlocksToPosition(
						[ pageClientId ],
						rootClientId,
						clientId,
						pageIndex < index ? 0 : getBlockOrder( clientId ).length
					)
				);
				return;
			}

			askToDetach( blocks, {
				message: __(
					'Pages can only be reordered among the other pages of a Page List. To move this page there, the Page List will be detached: its pages will become links that you can edit like any other link. New pages will still be added automatically.'
				),
				movedOutClientIds,
				cancel: undo,
			} );
			return;
		}

		setChangedBlocks( { blocks, isHeld: false } );

		// A Page List lists every page, so a removed page is hidden instead.
		const removedPageIds = missingPageIds.filter( ( pageId ) =>
			pagesById.has( pageId )
		);
		const treePageIds = getPageIds( blocks );
		const nextExcludedPageIDs = [
			...new Set( [
				...excludedPageIDs.filter(
					( id ) => ! treePageIds.includes( id )
				),
				...getHiddenPageIds( blocks ),
				...removedPageIds,
			] ),
		];
		if (
			nextExcludedPageIDs.length !== excludedPageIDs.length ||
			nextExcludedPageIDs.some(
				( id ) => ! excludedPageIDs.includes( id )
			)
		) {
			setAttributes( { excludedPageIDs: nextExcludedPageIDs } );
		}
		if ( removedPageIds.length ) {
			speak(
				sprintf(
					/* translators: %s: Page title. */
					__(
						'A Page List shows every page, so %s is hidden instead of removed.'
					),
					getPageTitle( pagesById.get( removedPageIds[ 0 ] )! )
				)
			);
		}

		// The first edit opens an undo level and the rest are staged into it,
		// so one undo puts every page back.
		const edits = getPageTreeEdits( pagesByParentId, parentPageID, blocks );
		const { editEntityRecord } = registry.dispatch( coreStore ) as {
			editEntityRecord: (
				kind: string,
				name: string,
				id: number,
				edits: Record< string, number >,
				options: { isCached: boolean }
			) => void;
		};
		edits.forEach( ( { id, menu_order: menuOrder, parent }, editIndex ) =>
			editEntityRecord(
				'postType',
				'page',
				id,
				parent === undefined
					? { menu_order: menuOrder }
					: { menu_order: menuOrder, parent },
				{ isCached: editIndex > 0 }
			)
		);
	};

	return { onChange, changedBlocks, pendingDetach };
}
