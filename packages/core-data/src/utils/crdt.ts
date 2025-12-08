/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
// @ts-expect-error No exported types.
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import {
	type CRDTDoc,
	type ObjectData,
	type SyncConfig,
	type Origin,
	Y,
} from '@wordpress/sync';

/**
 * Internal dependencies
 */
import {
	mergeCrdtBlocks,
	type Block,
	type YBlock,
	type YBlocks,
} from './crdt-blocks';
import { type Post } from '../entity-types/post';
import { type Type } from '../entity-types';
import {
	CRDT_DOC_META_PERSISTENCE_KEY,
	CRDT_RECORD_MAP_KEY,
	WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
} from '../sync';
import type { WPBlockSelection, WPSelection } from '../types';
import {
	createYMap,
	getRootMap,
	isYMap,
	type YMapRecord,
	type YMapWrap,
} from './crdt-utils';
import type {
	YFullSelection,
	YSelection,
	YSelectionHistory,
} from './block-selection-history';
import {
	BlockSelectionHistory,
	SELECTION_HISTORY_DEFAULT_SIZE,
	YSelectionType,
} from './block-selection-history';

// Changes that can be applied to a post entity record.
export type PostChanges = Partial< Post > & {
	blocks?: Block[];
	excerpt?: Post[ 'excerpt' ] | string;
	selection?: WPSelection;
	title?: Post[ 'title' ] | string;
};

// A post record as represented in the CRDT document (Y.Map).
export interface YPostRecord extends YMapRecord {
	author: number;
	blocks: YBlocks;
	categories: number[];
	comment_status: string;
	date: string | null;
	excerpt: string;
	featured_media: number;
	format: string;
	meta: YMapWrap< YMapRecord >;
	ping_status: string;
	slug: string;
	status: string;
	sticky: boolean;
	tags: number[];
	template: string;
	title: string;
}

// Properties that are allowed to be synced for a post.
const allowedPostProperties = new Set< string >( [
	'author',
	'blocks',
	'categories',
	'comment_status',
	'date',
	'excerpt',
	'featured_media',
	'format',
	'meta',
	'ping_status',
	'slug',
	'status',
	'sticky',
	'tags',
	'template',
	'title',
] );

// Post meta keys that should *not* be synced.
const disallowedPostMetaKeys = new Set< string >( [
	WORDPRESS_META_KEY_FOR_CRDT_DOC_PERSISTENCE,
] );

/**
 * Given a set of local changes to a generic entity record, apply those changes
 * to the local Y.Doc.
 *
 * @param {CRDTDoc}               ydoc
 * @param {Partial< ObjectData >} changes
 * @return {void}
 */
function defaultApplyChangesToCRDTDoc(
	ydoc: CRDTDoc,
	changes: ObjectData
): void {
	const ymap = getRootMap( ydoc, CRDT_RECORD_MAP_KEY );

	Object.entries( changes ).forEach( ( [ key, newValue ] ) => {
		// Cannot serialize function values, so cannot sync them.
		if ( 'function' === typeof newValue ) {
			return;
		}

		switch ( key ) {
			// Add support for additional data types here.

			default: {
				const currentValue = ymap.get( key );
				updateMapValue( ymap, key, currentValue, newValue );
			}
		}
	} );
}

/**
 * Given a set of local changes to a post record, apply those changes to the
 * local Y.Doc.
 *
 * @param {CRDTDoc}     ydoc
 * @param {PostChanges} changes
 * @param {Type}        _postType
 * @return {void}
 */
export function applyPostChangesToCRDTDoc(
	ydoc: CRDTDoc,
	changes: PostChanges,
	_postType: Type // eslint-disable-line @typescript-eslint/no-unused-vars
): void {
	const ymap = getRootMap< YPostRecord >( ydoc, CRDT_RECORD_MAP_KEY );

	Object.keys( changes ).forEach( ( key ) => {
		if ( ! allowedPostProperties.has( key ) ) {
			return;
		}

		const newValue = changes[ key ];

		// Cannot serialize function values, so cannot sync them.
		if ( 'function' === typeof newValue ) {
			return;
		}

		switch ( key ) {
			case 'blocks': {
				let currentBlocks = ymap.get( key );

				// Initialize.
				if ( ! ( currentBlocks instanceof Y.Array ) ) {
					currentBlocks = new Y.Array< YBlock >();
					ymap.set( key, currentBlocks );
				}

				// Block[] from local changes.
				const newBlocks = ( newValue as PostChanges[ 'blocks' ] ) ?? [];

				// Block changes from typing are bundled with a 'selection' update.
				// Pass the resulting cursor position to the mergeCrdtBlocks function.
				const cursorPosition =
					changes.selection?.selectionStart?.offset ?? null;

				// Merge blocks does not need `setValue` because it is operating on a
				// Yjs type that is already in the Y.Doc.
				mergeCrdtBlocks( currentBlocks, newBlocks, cursorPosition );
				break;
			}

			case 'excerpt': {
				const currentValue = ymap.get( 'excerpt' );
				const rawNewValue = getRawValue( newValue );

				updateMapValue( ymap, key, currentValue, rawNewValue );
				break;
			}

			// "Meta" is overloaded term; here, it refers to post meta.
			case 'meta': {
				let metaMap = ymap.get( 'meta' );

				// Initialize.
				if ( ! isYMap( metaMap ) ) {
					metaMap = createYMap< YMapRecord >();
					ymap.set( 'meta', metaMap );
				}

				// Iterate over each meta property in the new value and merge it if it
				// should be synced.
				Object.entries( newValue ?? {} ).forEach(
					( [ metaKey, metaValue ] ) => {
						if ( disallowedPostMetaKeys.has( metaKey ) ) {
							return;
						}

						updateMapValue(
							metaMap,
							metaKey,
							metaMap.get( metaKey ), // current value in CRDT
							metaValue // new value from changes
						);
					}
				);
				break;
			}

			case 'slug': {
				// Do not sync an empty slug. This indicates that the post is using
				// the default auto-generated slug.
				if ( ! newValue ) {
					break;
				}

				const currentValue = ymap.get( key );
				updateMapValue( ymap, key, currentValue, newValue );
				break;
			}

			case 'title': {
				const currentValue = ymap.get( key );

				// Copy logic from prePersistPostType to ensure that the "Auto
				// Draft" template title is not synced.
				let rawNewValue = getRawValue( newValue );
				if ( ! currentValue && 'Auto Draft' === rawNewValue ) {
					rawNewValue = '';
				}

				updateMapValue( ymap, key, currentValue, rawNewValue );
				break;
			}

			// Add support for additional properties here.

			default: {
				const currentValue = ymap.get( key );
				updateMapValue( ymap, key, currentValue, newValue );
			}
		}
	} );

	// Process changes that we don't want to persist to the CRDT document.
	if ( changes.selection ) {
		const selection = changes.selection;

		// Persist selection changes at the end of the current event loop.
		// This allows undo meta to be saved with the actual current selection before
		// it is overwritten by the new selection from CRDT document changes.
		setTimeout( () => {
			const selectionHistory = getBlockSelectionHistory( ydoc );
			selectionHistory.updateSelection( selection );
		}, 0 );
	}
}

function defaultGetChangesFromCRDTDoc( crdtDoc: CRDTDoc ): ObjectData {
	return getRootMap( crdtDoc, CRDT_RECORD_MAP_KEY ).toJSON();
}

/**
 * Given a local Y.Doc that *may* contain changes from remote peers, compare
 * against the local record and determine if there are changes (edits) we want
 * to dispatch.
 *
 * @param {CRDTDoc} ydoc
 * @param {Post}    editedRecord
 * @param {Type}    _postType
 * @param {any}     origin
 * @return {Partial<PostChanges>} The changes that should be applied to the local record.
 */
export function getPostChangesFromCRDTDoc(
	ydoc: CRDTDoc,
	editedRecord: Post,
	_postType: Type, // eslint-disable-line @typescript-eslint/no-unused-vars
	origin: Origin
): PostChanges {
	console.log(
		'getPostChangesFromCRDTDoc() from',
		origin instanceof Y.UndoManager ? 'undo-manager' : origin,
		'with editedRecord:',
		editedRecord
	);

	const ymap = getRootMap< YPostRecord >( ydoc, CRDT_RECORD_MAP_KEY );

	let allowedMetaChanges: Post[ 'meta' ] = {};

	const changes = Object.fromEntries(
		Object.entries( ymap.toJSON() ).filter( ( [ key, newValue ] ) => {
			if ( ! allowedPostProperties.has( key ) ) {
				return false;
			}

			const currentValue = editedRecord[ key ];

			switch ( key ) {
				case 'blocks': {
					// When we are passed a persisted CRDT document, make a special
					// comparison of the content and blocks.
					//
					// When other fields (besides `blocks`) are mutated outside the block
					// editor, the change is caught by an equality check (see other cases
					// in this `switch` statement). As a transient property, `blocks`
					// cannot be directly mutated outside the block editor -- only
					// `content` can.
					//
					// Therefore, for this special comparison, we serialize the `blocks`
					// from the persisted CRDT document and compare that to the content
					// from the persisted record. If they differ, we know that the content
					// in the database has changed, and therefore the blocks have changed.
					//
					// We cannot directly compare the `blocks` from the CRDT document to
					// the `blocks` derived from the `content` in the persisted record,
					// because the latter will have different client IDs.
					if (
						ydoc.meta?.get( CRDT_DOC_META_PERSISTENCE_KEY ) &&
						editedRecord.content
					) {
						const blocks = ymap.get( 'blocks' ) as YBlocks;
						return (
							__unstableSerializeAndClean(
								blocks.toJSON()
							).trim() !== editedRecord.content.raw.trim()
						);
					}

					// The consumers of blocks have memoization that renders optimization
					// here unnecessary.
					return true;
				}

				case 'date': {
					// Do not overwrite a "floating" date. Borrowing logic from the
					// isEditedPostDateFloating selector.
					const currentDateIsFloating =
						[ 'draft', 'auto-draft', 'pending' ].includes(
							ymap.get( 'status' ) as string
						) &&
						( null === currentValue ||
							editedRecord.modified === currentValue );

					if ( currentDateIsFloating ) {
						return false;
					}

					return haveValuesChanged( currentValue, newValue );
				}

				case 'meta': {
					allowedMetaChanges = Object.fromEntries(
						Object.entries( newValue ?? {} ).filter(
							( [ metaKey ] ) =>
								! disallowedPostMetaKeys.has( metaKey )
						)
					);

					// Merge the allowed meta changes with the current meta values since
					// not all meta properties are synced.
					const mergedValue = {
						...( currentValue as PostChanges[ 'meta' ] ),
						...allowedMetaChanges,
					};

					return haveValuesChanged( currentValue, mergedValue );
				}

				case 'status': {
					// Do not sync an invalid status.
					if ( 'auto-draft' === newValue ) {
						return false;
					}

					return haveValuesChanged( currentValue, newValue );
				}

				case 'excerpt':
				case 'title': {
					return haveValuesChanged(
						getRawValue( currentValue ),
						newValue
					);
				}

				// Add support for additional data types here.

				default: {
					return haveValuesChanged( currentValue, newValue );
				}
			}
		} )
	);

	// Meta changes must be merged with the edited record since not all meta
	// properties are synced.
	if ( 'object' === typeof changes.meta ) {
		changes.meta = {
			...editedRecord.meta,
			...allowedMetaChanges,
		};
	}

	return changes;
}

/**
 * This default sync config can be used for entities that are flat maps of
 * primitive values and do not require custom logic to merge changes.
 */
export const defaultSyncConfig: SyncConfig = {
	applyChangesToCRDTDoc: defaultApplyChangesToCRDTDoc,
	getChangesFromCRDTDoc: defaultGetChangesFromCRDTDoc,
};

/**
 * Extract the raw string value from a property that may be a string or an object
 * with a `raw` property (`RenderedText`).
 *
 * @param {unknown} value The value to extract from.
 * @return {string|undefined} The raw string value, or undefined if it could not be determined.
 */
function getRawValue( value?: unknown ): string | undefined {
	// Value may be a string property or a nested object with a `raw` property.
	if ( 'string' === typeof value ) {
		return value;
	}

	if (
		value &&
		'object' === typeof value &&
		'raw' in value &&
		'string' === typeof value.raw
	) {
		return value.raw;
	}

	return undefined;
}

function haveValuesChanged< ValueType >(
	currentValue: ValueType | undefined,
	newValue: ValueType | undefined
): boolean {
	return ! fastDeepEqual( currentValue, newValue );
}

function updateMapValue< T extends YMapRecord, K extends keyof T >(
	map: YMapWrap< T >,
	key: K,
	currentValue: T[ K ] | undefined,
	newValue: T[ K ] | undefined
): void {
	if ( undefined === newValue ) {
		map.delete( key );
		return;
	}

	if ( haveValuesChanged< T[ K ] >( currentValue, newValue ) ) {
		map.set( key, newValue );
	}
}

// WeakMap to store BlockSelectionHistory instances per Y.Doc
const selectionHistoryMap = new WeakMap< CRDTDoc, BlockSelectionHistory >();

/**
 * Get or create a BlockSelectionHistory instance for a given Y.Doc.
 * @param ydoc The Y.Doc to get the selection history for
 * @return The BlockSelectionHistory instance
 */
function getBlockSelectionHistory( ydoc: CRDTDoc ): BlockSelectionHistory {
	let history = selectionHistoryMap.get( ydoc );

	if ( ! history ) {
		history = new BlockSelectionHistory( ydoc );
		selectionHistoryMap.set( ydoc, history );
	}

	return history;
}

export function getSelectionHistoryMeta(
	ydoc: CRDTDoc
): YSelectionHistory | null {
	const selectionHistory = getBlockSelectionHistory( ydoc );

	let selectionToStore = selectionHistory.getCurrentSelection();
	const backupSelections = selectionHistory.getSelectionHistory(
		SELECTION_HISTORY_DEFAULT_SIZE
	);
	const firstBackupSelection = backupSelections[ 0 ];

	if ( selectionToStore === null ) {
		if ( firstBackupSelection === undefined ) {
			// If we don't have any selection to restore, don't return anything
			return null;
		}

		// Use the first backup selection if available
		selectionToStore = firstBackupSelection;
		backupSelections.shift();
	}

	return {
		selection: selectionToStore,
		backupSelections,
	};
}

export function findSelectionFromHistory(
	ydoc: Y.Doc,
	selectionHistory: YSelectionHistory
): WPSelection | null {
	const { selection, backupSelections } = selectionHistory;

	// Build a stack of positions to try, starting with the primary position
	const positionsToTry: YFullSelection[] = [ selection ];
	if ( backupSelections ) {
		positionsToTry.push( ...backupSelections );
	}

	// Try each position until we find one that exists in the document
	for ( const positionToTry of positionsToTry ) {
		const { start, end } = positionToTry;
		const startBlock = findBlockByClientIdInDoc( start.clientId, ydoc );
		const endBlock = findBlockByClientIdInDoc( end.clientId, ydoc );

		if ( ! startBlock || ! endBlock ) {
			// This block no longer exists, skip it.
			continue;
		}

		const startBlockSelection = convertYSelectionToBlockSelection(
			start,
			ydoc
		);
		const endBlockSelection = convertYSelectionToBlockSelection(
			end,
			ydoc
		);

		if ( startBlockSelection === null || endBlockSelection === null ) {
			continue;
		}

		return {
			selectionStart: startBlockSelection,
			selectionEnd: endBlockSelection,
		};
	}

	return null;
}

function convertYSelectionToBlockSelection(
	ySelection: YSelection,
	ydoc: Y.Doc
): WPBlockSelection | null {
	if ( ySelection.type === YSelectionType.RelativeSelection ) {
		const { relativePosition, attributeKey, clientId } = ySelection;

		const absolutePosition = Y.createAbsolutePositionFromRelativePosition(
			relativePosition,
			ydoc
		);

		if ( absolutePosition ) {
			return {
				clientId,
				attributeKey,
				offset: absolutePosition.index,
			};
		}
	} else if ( ySelection.type === YSelectionType.BlockSelection ) {
		return {
			clientId: ySelection.clientId,
			attributeKey: undefined,
			offset: undefined,
		};
	}

	return null;
}

export function findBlockByClientIdInDoc(
	blockId: string,
	ydoc: Y.Doc
): YBlock | null {
	const ymap = getRootMap< YPostRecord >( ydoc, CRDT_RECORD_MAP_KEY );
	const blocks = ymap.get( 'blocks' );

	if ( ! ( blocks instanceof Y.Array ) ) {
		return null;
	}

	return findBlockByClientIdInBlocks( blockId, blocks );
}

function findBlockByClientIdInBlocks(
	blockId: string,
	blocks: YBlocks
): YBlock | null {
	for ( const block of blocks ) {
		if ( block.get( 'clientId' ) === blockId ) {
			return block;
		}

		const innerBlocks = block.get( 'innerBlocks' );

		if ( innerBlocks && innerBlocks.length > 0 ) {
			const innerBlock = findBlockByClientIdInBlocks(
				blockId,
				innerBlocks
			);

			if ( innerBlock ) {
				return innerBlock;
			}
		}
	}

	return null;
}
