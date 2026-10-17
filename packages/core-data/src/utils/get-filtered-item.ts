import getNormalizedCommaSeparable from './get-normalized-comma-separable';
import setNestedValue from './set-nested-value';

/**
 * Cache of items to a map of the normalized `_fields` they were projected with
 * and the resulting projection. Keying on the item rather than on the state
 * keeps the cache alive across unrelated state updates, and lets it be
 * collected along with the item it projects.
 */
const filteredItemCache = new WeakMap<
	object,
	Map< string, Record< string, any > >
>();

/**
 * Returns the item reduced to the requested `_fields`. Caches the result per
 * item (by reference) and per field set (by value), so that:
 *
 * `getFilteredItem( item, 'id' ) === getFilteredItem( item, [ 'id' ] )`
 *
 * @param item    Item to filter.
 * @param _fields Fields to keep, as a comma-separated string or an array of paths.
 *
 * @return Item containing only the requested fields.
 */
export default function getFilteredItem< T = Record< string, any > >(
	item: object,
	_fields: string | string[] | undefined
): T {
	const fields = getNormalizedCommaSeparable( _fields ) ?? [];
	// The normalized fields joined back together is a canonical primitive key,
	// so equivalent queries hit the same entry whichever form they used.
	const fieldsKey = fields.join( ',' );

	let itemCache = filteredItemCache.get( item );
	if ( itemCache ) {
		const filtered = itemCache.get( fieldsKey );
		if ( filtered !== undefined ) {
			return filtered as T;
		}
	} else if ( item !== null && typeof item === 'object' ) {
		// A record is object-like, but it comes from a REST response, so a
		// malformed one must not throw on the `WeakMap` write. Project it
		// uncached instead.
		itemCache = new Map();
		filteredItemCache.set( item, itemCache );
	}

	const filteredItem = {};
	for ( let f = 0; f < fields.length; f++ ) {
		const field = fields[ f ].split( '.' );
		let value: any = item;
		field.forEach( ( fieldName ) => {
			value = value?.[ fieldName ];
		} );

		setNestedValue( filteredItem, field, value );
	}

	itemCache?.set( fieldsKey, filteredItem );
	return filteredItem as T;
}
