/**
 * External dependencies
 */
import * as fun from 'lib0/function';

/**
 * WordPress dependencies
 */
import { type CRDTDoc, type ObjectData, Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { mergeCrdtBlocks, type Block, type YBlock } from './crdt-blocks';

type MaybeRawValue = string | { raw: string };

interface PostChanges {
	blocks?: Block[];
	excerpt?: MaybeRawValue;
	status?: string;
	title?: MaybeRawValue;
}

// Key used to store the document map in the Y.Doc.
const DOCUMENT_MAP_KEY = 'document';

export function applyPostChangesToCRDTDoc(
	ydoc: CRDTDoc,
	changes: PostChanges,
	record: ObjectData,
	syncedProperties: Set< string >,
	origin: string
): void {
	const ymap = ydoc.getMap( DOCUMENT_MAP_KEY );

	Object.entries( changes ).forEach( ( [ key, newValue ] ) => {
		if ( ! syncedProperties.has( key ) ) {
			ymap.delete( key );
			return;
		}

		// Cannot serialize function values, so cannot sync them.
		if ( 'function' === typeof newValue ) {
			return;
		}

		// Return .get() result so that caller can operate on the data type
		// without having to call .get() themselves.
		function setValue< T = unknown >( updatedValue: T ): T {
			ymap.set( key, updatedValue );
			return ymap.get( key ) as T;
		}

		switch ( key ) {
			case 'blocks': {
				let currentBlocks = ymap.get( 'blocks' ) as Y.Array< YBlock >;

				if ( ! ( currentBlocks instanceof Y.Array ) ) {
					currentBlocks = setValue< Y.Array< YBlock > >(
						new Y.Array()
					); // Initialize
				}

				// Block[] from local changes.
				const newBlocks = newValue ?? [];

				// Merge blocks does not need `setValue` because it is operating on a
				// Yjs type that is already in the Y.Doc.
				mergeCrdtBlocks( currentBlocks, newBlocks, origin );
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

			case 'status': {
				const currentValue = ymap.get( 'status' ) as string | undefined;
				let newStatus = newValue;

				// Undefined status indicates that we want to reset to the current
				// persisted value.
				if ( undefined === newStatus ) {
					newStatus = record.status;
				}

				mergeValue( currentValue, newStatus, setValue );
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
}

/**
 * Given a local Y.Doc that *may* contain changes from remote peers, compare
 * against the local record and determine if there are changes (edits) we want
 * to dispatch.
 *
 * @param {CRDTDoc}       ydoc
 * @param {ObjectData}    record
 * @param {Set< string >} syncedProperties
 */
export function getPostChangesFromCRDTDoc(
	ydoc: CRDTDoc,
	record: ObjectData,
	syncedProperties: Set< string >
): Partial< PostChanges > {
	const ymap = ydoc.getMap( DOCUMENT_MAP_KEY );

	return Object.fromEntries(
		Object.entries( ymap.toJSON() ).filter( ( [ key, newValue ] ) => {
			if ( ! syncedProperties.has( key ) ) {
				return false;
			}

			const currentValue = record[ key ];

			switch ( key ) {
				case 'blocks': {
					// We don't need to add special equality checks for `blocks` here
					// since that is done by the store for us!
					return true;
				}

				case 'date': {
					// Do not sync an empty date if our current value is a "floating" date.
					// Borrowing logic from the isEditedPostDateFloating selector.
					const currentDateIsFloating =
						[ 'draft', 'auto-draft', 'pending' ].includes(
							ymap.get( 'status' ) as string
						) &&
						( null === currentValue ||
							record.modified === currentValue );

					if ( ! newValue && currentDateIsFloating ) {
						return false;
					}

					return haveValuesChanged( currentValue, newValue );
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
						getRawValue( currentValue as MaybeRawValue ),
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
}

function getRawValue( value?: MaybeRawValue ): string | undefined {
	// Value may be a string property or a nested object with a `raw` property.
	if ( 'string' === typeof value ) {
		return value;
	}

	return value?.raw;
}

function haveValuesChanged< ValueType = any >(
	currentValue: ValueType,
	newValue: ValueType
): boolean {
	return ! fun.equalityDeep( currentValue, newValue );
}

function mergeValue< ValueType = any >(
	currentValue: ValueType,
	newValue: ValueType,
	setValue: ( value: ValueType ) => ValueType
): void {
	if ( haveValuesChanged< ValueType >( currentValue, newValue ) ) {
		setValue( newValue );
	}
}
