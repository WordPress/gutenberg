import { isRecord } from './crdt-utils';
import getNestedValue from './get-nested-value';

/**
 * The parts of a block attribute definition that describe a list of unique
 * items.
 */
export interface UniqueListSchema {
	type?: string;
	query?: unknown;
	properties?: Record< string, UniqueListSchema >;
	uniqueItems?: boolean;
}

/**
 * A list of unique items that a block type declares in its attributes.
 */
export interface UniqueList {
	// Property names that lead to the list, e.g. `[ 'metadata', 'noteId' ]`.
	path: string[];
	// Start of the key that each item is stored under, e.g.
	// `metadata.noteId#`.
	itemKeyPrefix: string;
	// Key that the order of the items is stored under, e.g.
	// `metadata.noteId@order`.
	orderKey: string;
}

type BlockAttributes = Record< string, unknown >;

// Separates the path of a list from the ID of an item in the key of an item.
const ITEM_KEY_SEPARATOR = '#';

// Follows the path of a list in the key that stores the order of its items.
const ORDER_KEY_SUFFIX = '@order';

/**
 * Find the lists of unique items in the attribute definitions of a block
 * type.
 *
 * During real-time collaboration, a block attribute is stored in the shared
 * document as one value by default. When two collaborators write it at the
 * same time, one write replaces the other.
 *
 * A list that declares `uniqueItems` is stored differently. Each item gets its
 * own key next to the block's attributes, e.g. `metadata.noteId#12`. Two
 * collaborators who add different items write different keys, so the shared
 * document keeps both without running any code. Removing an item deletes only
 * its key. The block editor still sees a single list.
 *
 * @example
 * ```js
 * findUniqueLists( {
 *     content: { type: 'rich-text' },
 *     tags: { type: 'array', uniqueItems: true },
 *     metadata: {
 *         type: 'object',
 *         properties: {
 *             noteId: { type: 'array', uniqueItems: true },
 *         },
 *     },
 * } );
 * // => [
 * //     {
 * //         path: [ 'tags' ],
 * //         itemKeyPrefix: 'tags#',
 * //         orderKey: 'tags@order',
 * //     },
 * //     {
 * //         path: [ 'metadata', 'noteId' ],
 * //         itemKeyPrefix: 'metadata.noteId#',
 * //         orderKey: 'metadata.noteId@order',
 * //     },
 * // ]
 * ```
 *
 * @param schemas    Attribute definitions, by name.
 * @param parentPath Property names that lead to the definitions.
 * @return The lists of unique items.
 */
export function findUniqueLists(
	schemas: Record< string, UniqueListSchema >,
	parentPath: string[] = []
): UniqueList[] {
	const lists: UniqueList[] = [];

	for ( const [ name, schema ] of Object.entries( schemas ) ) {
		// Block types can come from plugins, so a definition can have any
		// shape. A value with a `query` is stored as a shared type instead.
		if ( ! schema || schema.query ) {
			continue;
		}

		const path = [ ...parentPath, name ];

		if ( schema.type === 'array' && schema.uniqueItems === true ) {
			lists.push( {
				path,
				itemKeyPrefix: path.join( '.' ) + ITEM_KEY_SEPARATOR,
				orderKey: path.join( '.' ) + ORDER_KEY_SUFFIX,
			} );
		} else if ( schema.type === 'object' && schema.properties ) {
			lists.push( ...findUniqueLists( schema.properties, path ) );
		}
	}

	return lists;
}

/**
 * Get the ID of a list item. Two items with the same ID are the same item.
 *
 * @param item List item.
 * @return The ID, or undefined when the item is not a string or number.
 */
function getItemId( item: unknown ): string | undefined {
	if ( typeof item === 'string' || typeof item === 'number' ) {
		return String( item );
	}

	return undefined;
}

/**
 * Index the items of a list by their ID. Items without an ID are skipped, and
 * so are items whose ID was already seen.
 *
 * @param value Value that may be a list of items.
 * @return The items by ID, in the order of the list.
 */
function getItemsById( value: unknown ): Map< string, unknown > {
	const items = new Map< string, unknown >();
	if ( ! Array.isArray( value ) ) {
		return items;
	}

	for ( const item of value ) {
		const id = getItemId( item );
		if ( id !== undefined && ! items.has( id ) ) {
			items.set( id, item );
		}
	}

	return items;
}

// Orders item IDs the same way for every collaborator. The locale is fixed so
// that the order does not depend on the language of the browser, and `numeric`
// puts 3 before 12.
const idCollator = new Intl.Collator( 'en', { numeric: true } );

/**
 * Sort item IDs into the order that items have when no order is stored.
 *
 * @param ids Item IDs.
 * @return A sorted copy.
 */
function sortIds( ids: string[] ): string[] {
	return [ ...ids ].sort( ( a, b ) => {
		const result = idCollator.compare( a, b );
		if ( result !== 0 ) {
			return result;
		}

		// The collator treats some different IDs as equal, e.g. `1` and
		// `01`. Compare them as plain strings, so that the order never
		// depends on the order the IDs arrive in.
		if ( a < b ) {
			return -1;
		}

		if ( a > b ) {
			return 1;
		}

		return 0;
	} );
}

/**
 * Return a copy of an object with a value set at a path. Missing parents are
 * created. A property that already exists keeps its place among the others.
 *
 * @param object Object to copy.
 * @param path   Property names to follow.
 * @param value  Value to set at the path.
 * @return The updated copy.
 */
function setValueAtPath(
	object: Record< string, unknown >,
	path: string[],
	value: unknown
): Record< string, unknown > {
	const [ key, ...rest ] = path;
	let child = value;

	if ( rest.length > 0 ) {
		let parent = {};
		const current = object[ key ];
		if ( isRecord( current ) ) {
			parent = current;
		}

		child = setValueAtPath( parent, rest, value );
	}

	return { ...object, [ key ]: child };
}

/**
 * Return a copy of an object with the list at a path taken out, and with it
 * any parent left empty.
 *
 * Inside an attribute, the order of the properties is the order they are
 * saved in. So a property that other properties follow is not removed. It
 * stays as an empty value, and `setValueAtPath` later fills it in the same
 * place. A block's attributes themselves are saved in the order of the block
 * type, so there the property is always removed.
 *
 * @param object            Object to copy.
 * @param path              Property names that lead to the list.
 * @param isInsideAttribute Whether the object is inside an attribute.
 * @return The updated copy.
 */
function removeListAtPath(
	object: Record< string, unknown >,
	path: string[],
	isInsideAttribute = false
): Record< string, unknown > {
	const [ key, ...rest ] = path;
	const copy = { ...object };
	let emptyValue: unknown = [];

	if ( rest.length > 0 ) {
		const current = copy[ key ];
		if ( ! isRecord( current ) ) {
			return copy;
		}

		const child = removeListAtPath( current, rest, true );
		if ( Object.keys( child ).length > 0 ) {
			copy[ key ] = child;
			return copy;
		}

		emptyValue = child;
	}

	const keys = Object.keys( copy );
	if ( isInsideAttribute && keys[ keys.length - 1 ] !== key ) {
		copy[ key ] = emptyValue;
	} else {
		delete copy[ key ];
	}

	return copy;
}

/**
 * Convert block attributes from the shape the block editor holds to the shape
 * stored in the shared document. Each item of a list of unique items moves out
 * of its attribute and becomes its own key.
 *
 * The order of the items is stored under one more key, but only when it
 * differs from the sorted order. Collaborators who change the order at the
 * same time write that one key, so one order wins. The items themselves are
 * never lost.
 *
 * A list is left alone when it is empty, when an item is not a string or
 * number, or when two items are the same.
 *
 * A list that other properties follow leaves an empty list behind, which
 * keeps its place. See `removeListAtPath`.
 *
 * @example
 * ```js
 * // `metadata.noteId` is a list of unique numbers.
 * expandUniqueLists(
 *     { metadata: { name: 'Intro', noteId: [ 3, 7 ] } },
 *     lists
 * );
 * // => {
 * //     metadata: { name: 'Intro' },
 * //     'metadata.noteId#3': 3,
 * //     'metadata.noteId#7': 7,
 * // }
 *
 * // `tags` is a list of unique strings. The order is stored, because it
 * // is not the sorted order.
 * expandUniqueLists( { tags: [ 'talk', 'keynote' ] }, lists );
 * // => {
 * //     'tags#talk': 'talk',
 * //     'tags#keynote': 'keynote',
 * //     'tags@order': [ 'talk', 'keynote' ],
 * // }
 *
 * // `name` follows the list, so an empty list keeps its place.
 * expandUniqueLists(
 *     { metadata: { noteId: [ 3 ], name: 'Intro' } },
 *     lists
 * );
 * // => {
 * //     metadata: { noteId: [], name: 'Intro' },
 * //     'metadata.noteId#3': 3,
 * // }
 * ```
 *
 * @param attributes Block attributes from the block editor.
 * @param lists      Lists of unique items of the block type.
 * @return Block attributes to store in the shared document.
 */
export function expandUniqueLists(
	attributes: BlockAttributes,
	lists: UniqueList[]
): BlockAttributes {
	let result = attributes;

	for ( const { path, itemKeyPrefix, orderKey } of lists ) {
		// An empty list stays in its attribute, so that the block editor
		// reads it back as an empty list instead of a missing value.
		const value = getNestedValue( result, path );
		if ( ! Array.isArray( value ) || value.length === 0 ) {
			continue;
		}

		const items = getItemsById( value );
		if ( items.size !== value.length ) {
			continue;
		}

		result = removeListAtPath( result, path );
		for ( const [ id, item ] of items ) {
			result[ itemKeyPrefix + id ] = item;
		}

		const ids = [ ...items.keys() ];
		const sortedIds = sortIds( ids );
		if ( ids.some( ( id, index ) => id !== sortedIds[ index ] ) ) {
			result[ orderKey ] = ids;
		}
	}

	return result;
}

/**
 * Convert block attributes from the shape stored in the shared document to the
 * shape the block editor holds. This is the inverse of `expandUniqueLists`.
 *
 * Items follow the stored order. Items that the stored order does not mention
 * come last, sorted by ID. That happens when a collaborator adds an item while
 * another one changes the order.
 *
 * The list goes back to the place it had in its parent. When that place was
 * not kept, the list becomes the last property.
 *
 * @param attributes Block attributes from the shared document.
 * @param lists      Lists of unique items of the block type.
 * @return Block attributes for the block editor.
 */
export function collapseUniqueLists(
	attributes: BlockAttributes,
	lists: UniqueList[]
): BlockAttributes {
	let result = attributes;

	for ( const { path, itemKeyPrefix, orderKey } of lists ) {
		const keys = Object.keys( result ).filter( ( key ) =>
			key.startsWith( itemKeyPrefix )
		);
		const order = result[ orderKey ];
		if ( keys.length === 0 && order === undefined ) {
			continue;
		}

		result = { ...result };
		delete result[ orderKey ];

		// Without item keys, the attribute holds the whole list, if any. An
		// order can remain when a collaborator removes all items while
		// another one changes the order.
		if ( keys.length === 0 ) {
			continue;
		}

		// A list with items inside the attribute was written by code that
		// does not know that the list has unique items. Keep its items too.
		// The next local change moves them to their own keys.
		const items = getItemsById( getNestedValue( result, path ) );

		// The shared document is not validated, so skip unexpected values.
		for ( const key of keys ) {
			const item = result[ key ];
			if ( getItemId( item ) !== undefined ) {
				items.set( key.slice( itemKeyPrefix.length ), item );
			}

			delete result[ key ];
		}

		let storedOrder: string[] = [];
		if ( Array.isArray( order ) ) {
			storedOrder = order
				.map( String )
				.filter( ( id ) => items.has( id ) );
		}

		// A set keeps the first position of each ID: its place in the stored
		// order, or else its place in the sorted order.
		const ids = new Set( [
			...storedOrder,
			...sortIds( [ ...items.keys() ] ),
		] );

		result = setValueAtPath(
			result,
			path,
			[ ...ids ].map( ( id ) => items.get( id ) )
		);
	}

	return result;
}
