/**
 * Internal dependencies
 */
import { getValueFromObjectPath } from '../../utils/object';

/**
 * Looks up a theme file URI based on a relative path.
 *
 * @param {string}        file          A relative path.
 * @param {Array<Object>} themeFileURIs A collection of absolute theme file URIs and their corresponding file paths.
 * @return {string?} A resolved theme file URI, if one is found in the themeFileURIs collection.
 */
export function getResolvedThemeFilePath( file, themeFileURIs = [] ) {
	const uri = themeFileURIs.find(
		( themeFileUri ) => themeFileUri.name === file
	);

	if ( ! uri?.href ) {
		return file;
	}

	return uri?.href;
}

/**
 * Mutates an object by settings a value at the provided path.
 *
 * @param {Object}              object Object to set a value in.
 * @param {number|string|Array} path   Path in the object to modify.
 * @param {*}                   value  New value to set.
 * @return {Object} Object with the new value set.
 */
function setMutably( object, path, value ) {
	path = path.split( '.' );
	const finalValueKey = path.pop();
	let prev = object;

	for ( const key of path ) {
		const current = prev[ key ];
		prev = current;
	}

	prev[ finalValueKey ] = value;

	return object;
}

/**
 * Resolves any relative paths if a corresponding theme file URI is available.
 * Note: this function mutates the object and is specifically to be used in
 * an async styles build context in useGlobalStylesOutput
 *
 * @param {Object}        themeJson     Theme.json/Global styles tree.
 * @param {Array<Object>} themeFileURIs A collection of absolute theme file URIs and their corresponding file paths.
 * @return {Object} Returns mutated object.
 */
export function setThemeFileUris( themeJson, themeFileURIs ) {
	if ( ! themeJson?.styles || ! themeFileURIs ) {
		return themeJson;
	}

	themeFileURIs.forEach( ( { name, href, target } ) => {
		const value = getValueFromObjectPath( themeJson, target );
		if ( value === name ) {
			/*
			 * The object must not be updated immutably here because the
			 * themeJson is a reference to the global styles tree used as a dependency in the
			 * useGlobalStylesOutputWithConfig() hook. If we don't mutate the object,
			 * the hook will detect the change and re-render the component, resulting
			 * in a maximum depth exceeded error.
			 */
			themeJson = setMutably( themeJson, target, href );
		}
	} );

	return themeJson;
}
