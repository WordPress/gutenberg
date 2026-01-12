/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * WordPress dependencies
 */
// @ts-expect-error No exported types.
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import { type CRDTDoc, type ObjectData, Y } from '@wordpress/sync';

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

export type PostChanges = Partial< Post > & {
	blocks?: Block[];
	excerpt?: Post[ 'excerpt' ] | string;
	selection?: WPSelection;
	title?: Post[ 'title' ] | string;
};

// Hold a reference to the last known selection to help compute Y.Text deltas.
let lastSelection: WPBlockSelection | null = null;

// Properties that are allowed to be synced for a post.
const allowedPostProperties = new Set< string >( [
	'author',
	'blocks',
	'comment_status',
	'date',
	'excerpt',
	'featured_media',
	'format',
	'ping_status',
	'meta',
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
export function defaultApplyChangesToCRDTDoc(
	ydoc: CRDTDoc,
	changes: ObjectData
): void {
	const ymap = ydoc.getMap( CRDT_RECORD_MAP_KEY );

	Object.entries( changes ).forEach( ( [ key, newValue ] ) => {
		// Cannot serialize function values, so cannot sync them.
		if ( 'function' === typeof newValue ) {
			return;
		}

		// Set the value in the root document.
		function setValue< T = unknown >( updatedValue: T ): void {
			ymap.set( key, updatedValue );
		}

		switch ( key ) {
			// Add support for additional data types here.

			default: {
				const currentValue = ymap.get( key );
				mergeValue( currentValue, newValue, setValue );
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
	const ymap = ydoc.getMap( CRDT_RECORD_MAP_KEY );

	Object.entries( changes ).forEach( ( [ key, newValue ] ) => {
		if ( ! allowedPostProperties.has( key ) ) {
			return;
		}

		// Cannot serialize function values, so cannot sync them.
		if ( 'function' === typeof newValue ) {
			return;
		}

		// Set the value in the root document.
		function setValue< T = unknown >( updatedValue: T ): void {
			ymap.set( key, updatedValue );
		}

		switch ( key ) {
			case 'blocks': {
				let currentBlocks = ymap.get( 'blocks' ) as YBlocks;

				// Initialize.
				if ( ! ( currentBlocks instanceof Y.Array ) ) {
					currentBlocks = new Y.Array< YBlock >();
					setValue( currentBlocks );
				}

				// Block[] from local changes.
				const newBlocks = ( newValue as PostChanges[ 'blocks' ] ) ?? [];

				// Merge blocks does not need `setValue` because it is operating on a
				// Yjs type that is already in the Y.Doc.
				mergeCrdtBlocks( currentBlocks, newBlocks, lastSelection );
				break;
			}

			case 'excerpt': {
				const currentValue = ymap.get( 'excerpt' ) as
					| string
					| undefined;
				const rawNewValue = getRawValue( newValue );

				mergeValue( currentValue, rawNewValue, setValue );
				break;
			}

			// "Meta" is overloaded term; here, it refers to post meta.
			case 'meta': {
				let metaMap = ymap.get( 'meta' ) as Y.Map< unknown >;

				// Initialize.
				if ( ! ( metaMap instanceof Y.Map ) ) {
					metaMap = new Y.Map();
					setValue( metaMap );
				}

				// Iterate over each meta property in the new value and merge it if it
				// should be synced.
				Object.entries( newValue ?? {} ).forEach(
					( [ metaKey, metaValue ] ) => {
						if ( disallowedPostMetaKeys.has( metaKey ) ) {
							return;
						}

						mergeValue(
							metaMap.get( metaKey ), // current value in CRDT
							metaValue, // new value from changes
							( updatedMetaValue: unknown ): void => {
								metaMap.set( metaKey, updatedMetaValue );
							}
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

				const currentValue = ymap.get( 'slug' ) as string;
				mergeValue( currentValue, newValue, setValue );
				break;
			}

			case 'title': {
				const currentValue = ymap.get( 'title' ) as string | undefined;

				// Copy logic from prePersistPostType to ensure that the "Auto
				// Draft" template title is not synced.
				let rawNewValue = getRawValue( newValue );
				if ( ! currentValue && 'Auto Draft' === rawNewValue ) {
					rawNewValue = '';
				}

				mergeValue( currentValue, rawNewValue, setValue );
				break;
			}

			// Add support for additional data types here.

			default: {
				const currentValue = ymap.get( key );
				mergeValue( currentValue, newValue, setValue );
			}
		}
	} );

	// Update the lastSelection for use in computing Y.Text deltas.
	if ( 'selection' in changes ) {
		lastSelection = changes.selection?.selectionStart ?? null;
	}
}

export function defaultGetChangesFromCRDTDoc( crdtDoc: CRDTDoc ): ObjectData {
	return crdtDoc.getMap( CRDT_RECORD_MAP_KEY ).toJSON();
}

/**
 * Given a local Y.Doc that *may* contain changes from remote peers, compare
 * against the local record and determine if there are changes (edits) we want
 * to dispatch.
 *
 * @param {CRDTDoc} ydoc
 * @param {Post}    editedRecord
 * @param {Type}    _postType
 * @return {Partial<PostChanges>} The changes that should be applied to the local record.
 */
export function getPostChangesFromCRDTDoc(
	ydoc: CRDTDoc,
	editedRecord: Post,
	_postType: Type // eslint-disable-line @typescript-eslint/no-unused-vars
): PostChanges {
	const ymap = ydoc.getMap( CRDT_RECORD_MAP_KEY );

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

function haveValuesChanged< ValueType = any >(
	currentValue: ValueType,
	newValue: ValueType
): boolean {
	return ! fastDeepEqual( currentValue, newValue );
}

function mergeValue< ValueType = any >(
	currentValue: ValueType,
	newValue: ValueType,
	setValue: ( value: ValueType ) => void
): void {
	if ( haveValuesChanged< ValueType >( currentValue, newValue ) ) {
		setValue( newValue );
	}
}
