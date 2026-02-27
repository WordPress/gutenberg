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
	object: Object,
	path: string | number | ( string | number )[],
	value: any
) {
	// Normalize path
	path = Array.isArray( path ) ? [ ...path ] : [ path ];

	// Shallowly clone the base of the object
	object = Array.isArray( object ) ? [ ...object ] : { ...object };

	const leaf = path.pop();

	// Traverse object from root to leaf, shallowly cloning at each level
	let prev = object;
	for ( const key of path ) {
		// @ts-expect-error
		const lvl = prev[ key ];
		// @ts-expect-error
		prev = prev[ key ] = Array.isArray( lvl ) ? [ ...lvl ] : { ...lvl };
	}
	// @ts-expect-error
	prev[ leaf ] = value;

	return object;
}

/**
 * Helper util to return a value from a certain path of the object.
 *
 * Path is specified as either:
 * - a string of properties, separated by dots, for example: "x.y".
 * - an array of properties, for example `[ 'x', 'y' ]`.
 *
 * You can also specify a default value in case the result is nullish.
 *
 * @param object       Input object.
 * @param path         Path to the object property.
 * @param defaultValue Default value if the value at the specified path is nullish.
 * @return Value of the object property at the specified path.
 */
export const getValueFromObjectPath = (
	object: Object,
	path: string | string[],
	defaultValue?: any
) => {
	const arrayPath = Array.isArray( path ) ? path : path.split( '.' );
	let value = object;
	arrayPath.forEach( ( fieldName ) => {
		// @ts-expect-error
		value = value?.[ fieldName ];
	} );
	return value ?? defaultValue;
};
