type AnyObject = Record< string, unknown >;
type ObjectOrArray = AnyObject | unknown[];
type ObjectPathKey = number | string;
type ObjectPath = ObjectPathKey | ObjectPathKey[];

/**
 * Immutably sets a value inside an object. Like `lodash#set`, but returning a
 * new object. Treats nullish initial values as empty objects. Clones any
 * nested objects. Supports arrays, too.
 *
 * @param object Object to set a value in.
 * @param path   Path in the object to modify.
 * @param value  New value to set.
 * @return Cloned object with the new value set.
 */
export function setImmutably(
	object: ObjectOrArray | null | undefined,
	path: ObjectPath,
	value: unknown
): ObjectOrArray {
	// Normalize path
	const pathArray: ObjectPathKey[] = Array.isArray( path )
		? [ ...path ]
		: [ path ];

	// Shallowly clone the base of the object
	const result: ObjectOrArray = Array.isArray( object )
		? [ ...object ]
		: { ...object };

	const leaf = pathArray.pop() as ObjectPathKey;

	// Traverse object from root to leaf, shallowly cloning at each level
	let prev: ObjectOrArray = result;
	for ( const key of pathArray ) {
		const lvl = ( prev as AnyObject )[ key ];
		( prev as AnyObject )[ key ] = prev = Array.isArray( lvl )
			? [ ...lvl ]
			: { ...( lvl as AnyObject ) };
	}

	( prev as AnyObject )[ leaf ] = value;

	return result;
}

/**
 * Helper util to return a value from a certain path of the object.
 * Path is specified as either:
 * - a string of properties, separated by dots, for example: "x.y".
 * - an array of properties, for example `[ 'x', 'y' ]`.
 * You can also specify a default value in case the result is nullish.
 *
 * @param object       Input object.
 * @param path         Path to the object property.
 * @param defaultValue Default value if the value at the specified path is nullish.
 * @return Value of the object property at the specified path.
 */
export const getValueFromObjectPath = (
	object: AnyObject | undefined | null,
	path: string | string[],
	defaultValue?: unknown
) => {
	const arrayPath = Array.isArray( path ) ? path : path.split( '.' );
	let value: unknown = object;
	arrayPath.forEach( ( fieldName ) => {
		value = ( value as AnyObject | undefined | null )?.[ fieldName ];
	} );
	return value ?? defaultValue;
};

/**
 * Helper util to filter out objects with duplicate values for a given property.
 *
 * @param array    Array of objects to filter.
 * @param property Property to filter unique values by.
 *
 * @return Array of objects with unique values for the specified property.
 */
export function uniqByProperty< T extends AnyObject >(
	array: T[],
	property: string
) {
	const seen = new Set();
	return array.filter( ( item ) => {
		const value = item[ property ];
		return seen.has( value ) ? false : seen.add( value );
	} );
}

/**
 * Recursively removes empty values from an object. A value is considered
 * empty when it is `undefined` or an object that itself contains no
 * non-empty values.
 *
 * @param object Object to clean.
 * @return Cleaned object, or `undefined` if nothing remains.
 */
export const cleanEmptyObject = ( object: unknown ): unknown => {
	if (
		object === null ||
		typeof object !== 'object' ||
		Array.isArray( object )
	) {
		return object;
	}

	const cleanedEntries: [ string, unknown ][] = [];
	for ( const [ key, value ] of Object.entries( object ) ) {
		const cleanedValue = cleanEmptyObject( value );
		if ( cleanedValue !== undefined ) {
			cleanedEntries.push( [ key, cleanedValue ] );
		}
	}
	return cleanedEntries.length
		? Object.fromEntries( cleanedEntries )
		: undefined;
};

function isPlainObject( value: unknown ): value is AnyObject {
	return (
		typeof value === 'object' && value !== null && ! Array.isArray( value )
	);
}

/**
 * Recursively determines the differences between two objects.
 * Keys present in `original` but not in `updated` (or explicitly set to undefined) are mapped to `undefined`.
 * Returns only the changed properties.
 *
 * @param original The original object.
 * @param updated  The updated object.
 * @return A new object containing only the differences, or undefined if no differences.
 */
export function getAttributesDiff(
	original: AnyObject | undefined | null,
	updated: AnyObject | undefined | null
): AnyObject | undefined {
	if ( original === updated ) {
		return undefined;
	}
	if ( ! original && ! updated ) {
		return undefined;
	}
	if ( ! original ) {
		return updated as AnyObject;
	}
	if ( ! updated ) {
		// If updated is explicitly set to empty/nullish but original had keys,
		// we should return an object mapping original keys to undefined to delete them.
		const diff: AnyObject = {};
		for ( const key in original ) {
			diff[ key ] = undefined;
		}
		return diff;
	}

	const diff: AnyObject = {};
	let hasDiff = false;

	// Check for new and updated keys
	for ( const key in updated ) {
		const originalValue = original[ key ];
		const updatedValue = updated[ key ];

		if ( originalValue === updatedValue ) {
			continue;
		}

		if (
			typeof originalValue === 'object' &&
			originalValue !== null &&
			! Array.isArray( originalValue ) &&
			typeof updatedValue === 'object' &&
			updatedValue !== null &&
			! Array.isArray( updatedValue )
		) {
			const nestedDiff = getAttributesDiff(
				originalValue as AnyObject,
				updatedValue as AnyObject
			);
			if ( nestedDiff !== undefined ) {
				diff[ key ] = nestedDiff;
				hasDiff = true;
			}
		} else {
			diff[ key ] = updatedValue;
			hasDiff = true;
		}
	}

	// Check for deleted keys
	for ( const key in original ) {
		if ( ! ( key in updated ) ) {
			diff[ key ] = undefined;
			hasDiff = true;
		}
	}

	return hasDiff ? diff : undefined;
}

/**
 * Recursively applies a difference object to an original object.
 * Keys mapped to `undefined` in the diff are deleted from the result.
 *
 * @param original The original object.
 * @param diff     The difference object to apply.
 * @return A new object with the differences applied.
 */
export function applyAttributesDiff(
	original: AnyObject | undefined | null,
	diff: AnyObject | undefined | null
): AnyObject {
	if ( ! diff ) {
		return original ? { ...original } : {};
	}

	const result = original ? { ...original } : {};

	for ( const key in diff ) {
		const diffValue = diff[ key ];

		if ( diffValue === undefined ) {
			delete result[ key ];
		} else if (
			typeof diffValue === 'object' &&
			diffValue !== null &&
			! Array.isArray( diffValue )
		) {
			result[ key ] = applyAttributesDiff(
				result[ key ] as AnyObject,
				diffValue as AnyObject
			);
		} else {
			result[ key ] = diffValue;
		}
	}

	return result;
}

/**
 * Distributes a `setAttributes` payload across multiple blocks, returning
 * attribute updates keyed by client ID.
 *
 * The payload follows `setAttributes` merge semantics: only its top-level
 * keys are considered, and each is compared against the primary block's
 * attributes to determine what actually changed. Plain object values (e.g.
 * `style`) are treated as snapshots of that attribute: their nested diff is
 * applied to each block's own value, so distinct per-block styles are
 * preserved while removals still propagate. Scalar, array and explicit
 * `undefined` values are applied to every block as-is, so attribute clears
 * propagate.
 *
 * @param primaryAttributes Current attributes of the primary block.
 * @param newAttributes     The `setAttributes` payload.
 * @param blocks            Blocks to update, including the primary block.
 * @return Attribute updates keyed by client ID, or undefined if nothing changed.
 */
export function getPerBlockAttributeUpdates(
	primaryAttributes: AnyObject | undefined,
	newAttributes: AnyObject | undefined | null,
	blocks: Array< { clientId: string; attributes: AnyObject } | null >
): Record< string, AnyObject > | undefined {
	if ( ! newAttributes ) {
		return undefined;
	}

	const changes: Array< [ string, unknown ] > = [];
	for ( const [ key, newValue ] of Object.entries( newAttributes ) ) {
		const primaryValue = primaryAttributes?.[ key ];
		if ( primaryValue === newValue ) {
			continue;
		}
		if (
			isPlainObject( newValue ) ||
			( newValue === undefined && isPlainObject( primaryValue ) )
		) {
			const nestedDiff = getAttributesDiff(
				primaryValue as AnyObject | undefined,
				newValue as AnyObject | undefined
			);
			if ( nestedDiff !== undefined ) {
				changes.push( [ key, nestedDiff ] );
			}
		} else {
			changes.push( [ key, newValue ] );
		}
	}

	if ( ! changes.length ) {
		return undefined;
	}

	const updates: Record< string, AnyObject > = {};
	for ( const block of blocks ) {
		if ( ! block ) {
			continue;
		}
		const update: AnyObject = {};
		for ( const [ key, change ] of changes ) {
			update[ key ] = isPlainObject( change )
				? cleanEmptyObject(
						applyAttributesDiff(
							block.attributes?.[ key ] as AnyObject | undefined,
							change
						)
				  )
				: change;
		}
		updates[ block.clientId ] = update;
	}
	return updates;
}
