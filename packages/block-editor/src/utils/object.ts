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
