/**
 * External dependencies
 */
import * as fun from 'lib0/function';

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';
import { type CRDTDoc, Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { mergeCrdtBlocks, type Block, type YBlock } from './crdt-blocks';
import { type Post } from '../entity-types/post';
import { type Type } from '../entity-types';

type PostChanges = Partial< Post > & { blocks?: Block[] };

// Key used to store the document map in the Y.Doc.
const DOCUMENT_MAP_KEY = 'document';

/**
 * Given a set of local changes to a post record, apply those changes to the
 * local Y.Doc.
 *
 * @param {CRDTDoc}       ydoc
 * @param {PostChanges}   changes
 * @param {Post}          rawRecord
 * @param {Type}          postType
 * @param {Set< string >} syncedProperties
 * @param {string}        origin
 * @return {void}
 */
export function applyPostChangesToCRDTDoc(
	ydoc: CRDTDoc,
	changes: PostChanges,
	rawRecord: Post,
	postType: Type,
	syncedProperties: Set< string >,
	origin: string
): void {
	const ymap = ydoc.getMap( DOCUMENT_MAP_KEY );

	Object.entries( changes ).forEach( ( [ key, newValue ] ) => {
		if ( ! syncedProperties.has( key ) ) {
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
				let currentBlocks = ymap.get( 'blocks' ) as Y.Array< YBlock >;

				// Initialize.
				if ( ! ( currentBlocks instanceof Y.Array ) ) {
					currentBlocks = new Y.Array();
					setValue( currentBlocks );
				}

				// Block[] from local changes.
				const newBlocks = ( newValue as PostChanges[ 'blocks' ] ) ?? [];

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

			// Meta is overloaded term in Core; here, it refers to post meta.
			case 'meta': {
				let metaMap = ymap.get( 'meta' ) as Y.Map< unknown >;

				// Initialize.
				if ( ! ( metaMap instanceof Y.Map ) ) {
					metaMap = new Y.Map();
					setValue( metaMap );
				}

				// Iterate over each meta property in the new value and merge it (if it
				// is a synced meta property).
				Object.entries( newValue ?? {} ).forEach(
					( [ metaKey, metaValue ] ) => {
						if (
							! shouldSyncMetaForPostType( metaKey, postType )
						) {
							return;
						}

						mergeValue(
							metaMap.get( metaKey ), // current value in CRDT
							metaValue, // new value from local changes
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

			case 'status': {
				const currentValue = ymap.get( 'status' ) as string | undefined;
				let newStatus = newValue;

				// Undefined status indicates that we want to reset to the current
				// persisted value.
				if ( undefined === newStatus ) {
					newStatus = rawRecord.status;
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
 * @param {Post}          record
 * @param {Type}          postType
 * @param {Set< string >} syncedProperties
 * @return {Partial<PostChanges>} The changes that should be applied to the local record.
 */
export function getPostChangesFromCRDTDoc(
	ydoc: CRDTDoc,
	record: Post,
	postType: Type,
	syncedProperties: Set< string >
): PostChanges {
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

				case 'meta': {
					const allowedMeta = Object.fromEntries(
						Object.entries( newValue ?? {} ).filter(
							( [ metaKey ] ) =>
								shouldSyncMetaForPostType( metaKey, postType )
						)
					);

					// Merge the allowed meta changes with the current meta values since
					// not all meta properties are synced.
					const mergedValue = {
						...( currentValue as PostChanges[ 'meta' ] ),
						...allowedMeta,
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
	return ! fun.equalityDeep( currentValue, newValue );
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

/**
 * Given a post type definition, return the set of properties that should be
 * synced for that post type.
 *
 * @param {Type} postType The post type definition.
 * @return {Set<string>} The set of properties that should be synced.
 */
export function getSyncedPropertiesForPostType(
	postType: Type
): Set< string > {
	const syncedProperties = new Set< string >( [
		'date',
		'status',
		'tags',
		'template',
		'slug',
		'sticky',
	] );

	Object.entries( postType.supports || {} ).forEach(
		( [ feature, isSupported ] ) => {
			if ( ! isSupported ) {
				return;
			}

			switch ( feature ) {
				case 'author':
					syncedProperties.add( 'author' );
					break;
				case 'comments':
					syncedProperties.add( 'comment_status' );
					break;
				case 'custom-fields':
					syncedProperties.add( 'meta' );
					break;
				case 'editor':
					syncedProperties.add( 'blocks' );
					break;
				case 'excerpt':
					syncedProperties.add( 'excerpt' );
					break;
				case 'post-formats':
					syncedProperties.add( 'format' );
					break;
				case 'thumbnail':
					syncedProperties.add( 'featured_media' );
					break;
				case 'trackbacks':
					syncedProperties.add( 'ping_status' );
					break;
				case 'title':
					syncedProperties.add( 'title' );
					break;
			}
		}
	);

	return syncedProperties;
}

const metaDecisionCache: Map< string, Map< string, boolean > > = new Map();

/**
 * Given a meta key and post type definition, return a decision on whether to
 * sync the meta property.
 *
 * @param {string} metaKey  The meta key.
 * @param {Type}   postType The post type definition.
 * @return {boolean} Whether to sync the meta property.
 */
function shouldSyncMetaForPostType( metaKey: string, postType: Type ): boolean {
	if ( ! metaDecisionCache.has( postType.slug ) ) {
		metaDecisionCache.set( postType.slug, new Map() );
	}

	const decisionMap = metaDecisionCache.get( postType.slug )!;

	if ( decisionMap.has( metaKey ) ) {
		return decisionMap.get( metaKey )!;
	}

	/**
	 * In order to be available to the sync module, meta properties must be
	 * registered against the post type and made available via the REST API
	 * (`'show_in_rest' => true`).
	 *
	 * Of the registered meta properties, by default we do not sync "hidden" meta
	 * fields (leading underscore in the meta key). This filter allows third-party
	 * code to override that behavior.
	 *
	 * @param {boolean} shouldSync   Whether to sync the meta property.
	 * @param {string}  metaKey      Meta key.
	 * @param {string}  postTypeSlug The post type slug.
	 * @param {Type}    postType     The post type definition.
	 * @return {boolean} The filtered list of meta properties to sync.
	 */
	const shouldSync = Boolean(
		applyFilters(
			'sync.shouldSyncMeta',
			! metaKey.startsWith( '_' ),
			metaKey,
			postType.slug,
			postType
		)
	);

	decisionMap.set( metaKey, shouldSync );

	return shouldSync;
}
